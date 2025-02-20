const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

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
            ]);

            res.json(stats);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category statistics',
                details: error.message
            });
        }
    }

    // Get category patterns for auto-categorization
    static async getCategoryPatterns(req, res) {
        try {
            const patterns = await Transaction.aggregate([
                {
                    $match: {
                        userId: req.user._id,
                        category: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$description',
                        category: { $last: '$category' },
                        subcategory: { $last: '$subcategory' },
                        confidence: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$category', '$category'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        total: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        category: 1,
                        subcategory: 1,
                        confidence: { $divide: ['$confidence', '$total'] }
                    }
                }
            ]);

            res.json(patterns);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category patterns',
                details: error.message
            });
        }
    }

    // Update category patterns
    static async updateCategoryPatterns(req, res) {
        try {
            const { patterns } = req.body;
            // Store patterns in cache or database
            // This is a simplified version - you might want to use Redis or another caching solution
            global.categoryPatterns = patterns;
            
            res.json({ message: 'Category patterns updated successfully' });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to update category patterns',
                details: error.message
            });
        }
    }

    // Suggest category for transaction
    static async suggestCategory(req, res) {
        try {
            const { description } = req.body;
            const patterns = global.categoryPatterns || [];

            // Find best matching pattern
            let bestMatch = null;
            let highestConfidence = 0;

            for (const pattern of patterns) {
                const similarity = this.calculateSimilarity(
                    this.normalizeDescription(description),
                    this.normalizeDescription(pattern._id)
                );

                const confidence = similarity * pattern.confidence;
                if (confidence > highestConfidence) {
                    highestConfidence = confidence;
                    bestMatch = pattern;
                }
            }

            if (bestMatch && highestConfidence >= 0.6) {
                res.json({
                    category: bestMatch.category,
                    subcategory: bestMatch.subcategory,
                    confidence: highestConfidence
                });
            } else {
                res.json(null);
            }
        } catch (error) {
            res.status(500).json({
                error: 'Failed to suggest category',
                details: error.message
            });
        }
    }

    // Helper method to normalize description
    static normalizeDescription(description) {
        return description
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Helper method to calculate string similarity
    static calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

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

    // Auto-categorization methods
    static async getCategoryPatternsAuto(req, res) {
        try {
            const patterns = await Category.aggregate([
                { $match: { userId: req.user.id } },
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
            res.status(500).json({ message: 'Error getting category patterns' });
        }
    }

    static async suggestCategoryAuto(req, res) {
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
                const merchantTransactions = await Transaction.find({
                    userId: req.user.id,
                    merchant: { $regex: merchant, $options: 'i' }
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
            res.status(500).json({ message: 'Error suggesting category' });
        }
    }

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
            res.status(500).json({ message: 'Error training category model' });
        }
    }

    static async batchCategorizeTransactions(req, res) {
        try {
            const { transactions } = req.body;
            const categorizedTransactions = [];

            for (const transaction of transactions) {
                const suggestion = await this.suggestCategoryAuto({
                    body: {
                        description: transaction.description,
                        amount: transaction.amount,
                        merchant: transaction.merchant
                    },
                    user: req.user
                }, { json: (data) => data });

                categorizedTransactions.push({
                    ...transaction,
                    suggestedCategory: suggestion
                });
            }

            res.json(categorizedTransactions);
        } catch (error) {
            console.error('Error batch categorizing transactions:', error);
            res.status(500).json({ message: 'Error batch categorizing transactions' });
        }
    }

    // Utility function to calculate string similarity
    static calculateSimilarityAuto(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

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
}

module.exports = CategoryController;