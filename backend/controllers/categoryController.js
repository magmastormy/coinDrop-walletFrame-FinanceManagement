const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

class CategoryController {
    // Create a new category
    static async createCategory(req, res) {
        try {
            const categoryData = {
                ...req.body,
                userId: req.user._id || req.query.userId || req.user.userId
            };
            const category = new Category(categoryData);
            await category.save();

            res.status(201).json({
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            res.status(400).json({
                error: 'Category creation failed',
                details: error.message
            });
        }
    }

    // Get all categories for a user
    static async getUserCategories(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            if (!userId) {
                return res.status(400).json({
                    error: 'User ID is required',
                    details: 'No user ID provided'
                });
            }
            const categories = await Category.find({ userId });

            res.json(categories);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve categories',
                details: error.message
            });
        }
    }

    // Get category hierarchy
    static async getCategoryHierarchy(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const hierarchy = await Category.getCategoryHierarchy(userId);
            res.json(hierarchy);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category hierarchy',
                details: error.message
            });
        }
    }

    // Get subcategories for a category
    static async getSubcategories(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            const subcategories = await category.getAllSubcategories();
            res.json(subcategories);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve subcategories',
                details: error.message
            });
        }
    }

    // Add a subcategory
    static async addSubcategory(req, res) {
        try {
            const parentCategory = await Category.findById(req.params.id);
            if (!parentCategory) {
                return res.status(404).json({ error: 'Parent category not found' });
            }

            const subcategoryData = {
                ...req.body,
                userId: req.user._id,
                parentId: parentCategory._id
            };

            const subcategory = new Category(subcategoryData);
            await subcategory.save();

            res.status(201).json({
                message: 'Subcategory created successfully',
                subcategory
            });
        } catch (error) {
            res.status(400).json({
                error: 'Subcategory creation failed',
                details: error.message
            });
        }
    }

    // Update parent category
    static async updateParentCategory(req, res) {
        try {
            const { newParentId } = req.body;
            const category = await Category.findById(req.params.id);
            
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            if (newParentId) {
                const newParent = await Category.findById(newParentId);
                if (!newParent) {
                    return res.status(404).json({ error: 'New parent category not found' });
                }
            }

            category.parentId = newParentId || null;
            await category.save();

            res.json({
                message: 'Category parent updated successfully',
                category
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to update category parent',
                details: error.message
            });
        }
    }

    // Get budgets for a category
    static async getCategoryBudgets(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const budgets = await Budget.find({ categoryId: category._id });
            res.json(budgets);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category budgets',
                details: error.message
            });
        }
    }

    // Get transactions for a category
    static async getCategoryTransactions(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const transactions = await Transaction.getTransactionsByCategory(
                req.params.id,
                {
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    userId: req.user._id
                }
            );
            res.json(transactions);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category transactions',
                details: error.message
            });
        }
    }

    // Get category statistics
    static async getCategoryStats(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const subcategories = await category.getAllSubcategories();
            const categoryIds = [category._id, ...subcategories.map(sub => sub._id)];

            const stats = await Transaction.aggregate([
                {
                    $match: {
                        category: { $in: categoryIds },
                        userId: req.user._id
                    }
                },
                {
                    $group: {
                        _id: {
                            category: '$category',
                            month: { $month: '$date' },
                            year: { $year: '$date' }
                        },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' }
                    }
                },
                {
                    $sort: {
                        '_id.year': -1,
                        '_id.month': -1
                    }
                }
            ]).cache({ key: `category-stats-${req.params.id}`, ttl: 3600 });

            res.json(stats);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category statistics',
                details: error.message
            });
        }
    }

    // Calculating string similarity is now centralized in one function
    static calculateSimilarity(str1, str2) {
        // Normalize descriptions
        str1 = str1.toLowerCase().trim().replace(/[^\w\s]/g, '');
        str2 = str2.toLowerCase().trim().replace(/[^\w\s]/g, '');
        
        if (str1 === str2) return 1.0;
        
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0 || len2 === 0) {
            return 0.0;
        }
        
        // Levenshtein distance calculation
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) {
            matrix[i][0] = i;
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        return 1 - (distance / maxLength);
    }

    // The getCategoryPatterns method remains the primary function for pattern retrieval
    static async getCategoryPatterns(req, res) {
        try {
            const userId = req.user._id;
            const patterns = await Category.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'transactions'
                    }
                },
                {
                    $project: {
                        name: 1,
                        patterns: {
                            $map: {
                                input: '$transactions',
                                as: 'transaction',
                                in: {
                                    pattern: '$$transaction.description',
                                    confidence: { $literal: 1 }
                                }
                            }
                        }
                    }
                }
            ]);
            
            // Organize the patterns in a more usable format
            const patternMap = {};
            patterns.forEach(category => {
                category.patterns.forEach(pattern => {
                    patternMap[pattern.pattern] = {
                        categoryId: category._id,
                        name: category.name,
                        confidence: pattern.confidence
                    };
                });
            });
            
            res.json(patternMap);
        } catch (error) {
            console.error('Error getting category patterns:', error);
            res.status(500).json({ 
                error: 'Failed to retrieve category patterns',
                details: error.message 
            });
        }
    }

    // The suggestCategory method handles all category suggestions
    static async suggestCategory(req, res) {
        try {
            const { description, amount, merchant } = req.body;
            
            // First try pattern matching
            const patterns = await Category.aggregate([
                { $match: { userId: req.user.id } },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'transactions'
                    }
                }
            ]);
            
            let bestMatch = null;
            let highestConfidence = 0;
            
            patterns.forEach(category => {
                category.transactions.forEach(transaction => {
                    const similarity = this.calculateSimilarity(
                        description.toLowerCase(),
                        transaction.description.toLowerCase()
                    );
                    if (similarity > highestConfidence) {
                        highestConfidence = similarity;
                        bestMatch = {
                            categoryId: category._id,
                            name: category.name,
                            confidence: similarity
                        };
                    }
                });
            });
            
            if (bestMatch && bestMatch.confidence > 0.8) {
                return res.json(bestMatch);
            }
            
            // If no good pattern match, use amount-based heuristics
            const similarTransactions = await Transaction.find({
                userId: req.user.id,
                amount: { 
                    $gte: amount * 0.9, 
                    $lte: amount * 1.1 
                }
            }).populate('category');
            
            if (similarTransactions.length > 0) {
                const categoryCounts = {};
                similarTransactions.forEach(transaction => {
                    const categoryId = transaction.category._id.toString();
                    categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
                });
                
                const mostCommonCategory = Object.entries(categoryCounts)
                    .sort((a, b) => b[1] - a[1])[0];
                
                if (mostCommonCategory) {
                    const category = await Category.findById(mostCommonCategory[0]);
                    return res.json({
                        categoryId: category._id,
                        name: category.name,
                        confidence: 0.7
                    });
                }
            }
            
            // If still no match, suggest based on merchant if available
            if (merchant) {
                const safeMerchant = escapeRegex(merchant);
                const merchantTransactions = await Transaction.find({
                    userId: req.user.id,
                    merchant: { $regex: safeMerchant, $options: 'i' }
                }).populate('category');
                
                if (merchantTransactions.length > 0) {
                    const category = merchantTransactions[0].category;
                    return res.json({
                        categoryId: category._id,
                        name: category.name,
                        confidence: 0.6
                    });
                }
            }
            
            // If no suggestions found
            res.json(null);
        } catch (error) {
            console.error('Error suggesting category:', error);
            res.status(500).json({ 
                error: 'Failed to suggest category',
                details: error.message 
            });
        }
    }

    // Training is still a separate function to maintain clean separation of concerns
    static async trainCategoryModel(req, res) {
        try {
            const { transactions } = req.body;
            
            // Update pattern confidence based on new transactions
            for (const transaction of transactions) {
                await Category.updateOne(
                    { 
                        _id: transaction.category,
                        userId: req.user.id
                    },
                    {
                        $addToSet: {
                            patterns: {
                                pattern: transaction.description,
                                confidence: 1
                            }
                        }
                    }
                );
            }
            
            res.json({ message: 'Category model trained successfully' });
        } catch (error) {
            console.error('Error training category model:', error);
            res.status(500).json({ 
                error: 'Failed to train category model',
                details: error.message 
            });
        }
    }

    // Update a category
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.query.userId || req.user.userId;

            const category = await Category.findOne({ _id: id, userId });
            if (!category) {
                return res.status(404).json({
                    error: 'Category not found',
                    details: 'Category does not exist or does not belong to user'
                });
            }

            // Update only allowed fields
            const allowedUpdates = [
                'name',
                'description',
                'color',
                'icon',
                'budgetType',
                'isActive',
                'parentId',
                'patterns'
            ];

            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });

            // If updating parentId, verify the parent exists and belongs to user
            if (updates.parentId) {
                const parentCategory = await Category.findOne({
                    _id: updates.parentId,
                    userId
                });

                if (!parentCategory) {
                    return res.status(400).json({
                        error: 'Invalid parent category',
                        details: 'Parent category does not exist or does not belong to user'
                    });
                }

                // Prevent circular references
                if (await category.wouldCreateCircularReference(updates.parentId)) {
                    return res.status(400).json({
                        error: 'Invalid parent category',
                        details: 'This would create a circular reference in the category hierarchy'
                    });
                }
            }

            // Update the category
            Object.assign(category, updates);
            await category.save();

            res.json({
                message: 'Category updated successfully',
                category
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to update category',
                details: error.message
            });
        }
    }

    // Delete a category
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.query.userId || req.user.userId;

            const category = await Category.findOne({ _id: id, userId });
            if (!category) {
                return res.status(404).json({
                    error: 'Category not found',
                    details: 'Category does not exist or does not belong to user'
                });
            }

            // Check if category has subcategories
            const subcategories = await Category.find({ parentId: id });
            if (subcategories.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete category',
                    details: 'Category has subcategories. Delete or reassign them first.'
                });
            }

            // Check if category is used in any transactions
            const transactions = await Transaction.find({ category: id });
            if (transactions.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete category',
                    details: 'Category is used in transactions. Update or delete them first.'
                });
            }

            // Check if category is used in any budgets
            const budgets = await Budget.find({ categoryId: id });
            if (budgets.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete category',
                    details: 'Category is used in budgets. Update or delete them first.'
                });
            }

            await category.deleteOne();

            res.json({
                message: 'Category deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete category',
                details: error.message
            });
        }
    }

    static async updateCategoryPatterns(req, res) {
        try {
            const { categoryId, patterns } = req.body;
            const userId = req.user._id;

            // Validate patterns format
            if (!Array.isArray(patterns)) {
                return res.status(400).json({ 
                    error: 'Invalid patterns format',
                    details: 'Patterns must be an array of { pattern: string, confidence: number }' 
                });
            }

            // Update patterns for the category
            await Category.updateOne(
                { _id: categoryId, userId },
                { $set: { patterns } }
            );

            res.json({ message: 'Category patterns updated successfully' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to update patterns', 
                details: error.message 
            });
        }
    }

    static async batchCategorizeTransactions(req, res) {
        try {
            const { transactionIds, categoryId } = req.body;
            const userId = req.user._id;

            // Validate inputs
            if (!Array.isArray(transactionIds) || !categoryId) {
                return res.status(400).json({ 
                    error: 'Invalid input',
                    details: 'transactionIds must be an array, and categoryId is required' 
                });
            }

            // Update transactions in bulk
            const { modifiedCount } = await Transaction.updateMany(
                { 
                    _id: { $in: transactionIds }, 
                    userId 
                },
                { category: categoryId }
            );

            res.json({ 
                message: `${modifiedCount} transactions categorized successfully`,
                modifiedCount 
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to categorize transactions', 
                details: error.message 
            });
        }
    }
}

module.exports = CategoryController;