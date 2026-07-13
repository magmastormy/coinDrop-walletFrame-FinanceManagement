const logger = require('../utils/logger');

const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');
const { getAuthenticatedUserId } = require('../utils/authUser');

const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * Category Controller
 * Handles category-related operations including creation, retrieval, updating, and deletion
 */
class CategoryController {
    /**
     * Create a new category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async createCategory(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const categoryData = {
                ...req.body,
                userId
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

    /**
     * Get all categories for a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getUserCategories(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);

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

    /**
     * Get category hierarchy
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getCategoryHierarchy(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const hierarchy = await Category.getCategoryHierarchy(userId);
            res.json(hierarchy);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category hierarchy',
                details: error.message
            });
        }
    }

    /**
     * Get subcategories for a category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getSubcategories(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const category = await Category.findOne({ _id: req.params.id, userId });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            const subcategories = await category.getAllDescendants();
            res.json(subcategories);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve subcategories',
                details: error.message
            });
        }
    }

    /**
     * Add a subcategory
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async addSubcategory(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const parentCategory = await Category.findOne({ _id: req.params.id, userId });
            if (!parentCategory) {
                return res.status(404).json({ error: 'Parent category not found' });
            }

            const subcategoryData = {
                ...req.body,
                userId,
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

    /**
     * Update parent category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async updateParentCategory(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { newParentId } = req.body;
            const category = await Category.findOne({ _id: req.params.id, userId });
            
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            if (newParentId) {
                const newParent = await Category.findOne({ _id: newParentId, userId });
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

    /**
     * Get budgets for a category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getCategoryBudgets(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const category = await Category.findOne({ _id: req.params.id, userId });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const budgets = await Budget.find({ category: category._id, userId });
            res.json(budgets);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category budgets',
                details: error.message
            });
        }
    }

    /**
     * Get transactions for a category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getCategoryTransactions(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { startDate, endDate } = req.query;
            const query = {
                $or: [
                    { categoryId: req.params.id },
                    { category: req.params.id }
                ],
                userId
            };
            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = new Date(startDate);
                if (endDate) query.date.$lte = new Date(endDate);
            }
            const transactions = await Transaction.find(query).sort({ date: -1 });
            res.json(transactions);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category transactions',
                details: error.message
            });
        }
    }

    /**
     * Get category statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getCategoryStats(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const category = await Category.findOne({ _id: req.params.id, userId });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const subcategories = await category.getAllDescendants();
            const categoryIds = [category._id, ...subcategories.map(sub => sub._id)];

            const stats = await Transaction.aggregate([
                {
                    $match: {
                        category: { $in: categoryIds },
                        userId
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

    /**
     * Calculate string similarity using Levenshtein distance
     * @param {string} str1 - First string to compare
     * @param {string} str2 - Second string to compare
     * @returns {number} Similarity score between 0 and 1
     */
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

    /**
     * Get category patterns
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getCategoryPatterns(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const patterns = await Category.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
            logger.error('Error getting category patterns:', error);
            res.status(500).json({ 
                error: 'Failed to retrieve category patterns',
                details: error.message 
            });
        }
    }

    /**
     * Suggest category for a transaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async suggestCategory(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { description, amount, merchant } = req.body;
            
            // Get user categories
            const categories = await Category.find({ userId });
            
            // Load categories into AI model
            const categoryAIModel = require('../ai/categoryAIModel');
            await categoryAIModel.loadCategories(categories);
            
            // Use enhanced AI model for prediction
            const prediction = await categoryAIModel.predictCategory(description, amount, merchant);
            
            if (prediction.name !== 'Uncategorized') {
                return res.json({
                    categoryId: prediction._id,
                    name: prediction.name,
                    confidence: prediction.confidence
                });
            }
            
            // If no suggestions found
            res.json(null);
        } catch (error) {
            logger.error('Error suggesting category:', error);
            res.status(500).json({ 
                error: 'Failed to suggest category',
                details: error.message 
            });
        }
    }

    /**
     * Batch suggest categories for multiple transactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async batchSuggestCategories(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { transactions } = req.body;
            
            // Get user categories
            const categories = await Category.find({ userId });
            
            // Load categories into AI model
            const categoryAIModel = require('../ai/categoryAIModel');
            await categoryAIModel.loadCategories(categories);
            
            // Use batch prediction
            const results = await categoryAIModel.batchPredictCategories(transactions);
            
            res.json(results);
        } catch (error) {
            logger.error('Error in batch category suggestion:', error);
            res.status(500).json({ 
                error: 'Failed to suggest categories in batch',
                details: error.message 
            });
        }
    }

    /**
     * Batch learn from user corrections
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async batchLearnFromCorrections(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { corrections } = req.body;
            
            // Get user categories
            const categories = await Category.find({ userId });
            
            // Load categories into AI model
            const categoryAIModel = require('../ai/categoryAIModel');
            await categoryAIModel.loadCategories(categories);
            
            // Use batch learning
            await categoryAIModel.batchLearnCorrections(corrections);
            
            res.json({ message: 'Batch learning completed successfully' });
        } catch (error) {
            logger.error('Error in batch learning:', error);
            res.status(500).json({ 
                error: 'Failed to learn from corrections in batch',
                details: error.message 
            });
        }
    }

    /**
     * Train category model
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async trainCategoryModel(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { transactions } = req.body;
            
            // Update pattern confidence based on new transactions
            for (const transaction of transactions) {
                await Category.updateOne(
                    { 
                        _id: transaction.category,
                        userId
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
            logger.error('Error training category model:', error);
            res.status(500).json({ 
                error: 'Failed to train category model',
                details: error.message 
            });
        }
    }

    /**
     * Update a category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = getAuthenticatedUserId(req);

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid category ID format'
                });
            }

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
                let currentParentId = updates.parentId;
                while (currentParentId) {
                    if (currentParentId.toString() === id) {
                        return res.status(400).json({
                            error: 'Invalid parent category',
                            details: 'This would create a circular reference in the category hierarchy'
                        });
                    }
                    const parent = await Category.findById(currentParentId).select('parentId');
                    currentParentId = parent?.parentId;
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

    /**
     * Delete a category
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = getAuthenticatedUserId(req);

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid category ID format'
                });
            }

            const category = await Category.findOne({ _id: id, userId });
            if (!category) {
                return res.status(404).json({
                    error: 'Category not found',
                    details: 'Category does not exist or does not belong to user'
                });
            }

            // Check if category has subcategories
            const subcategories = await Category.find({ parentId: id, userId });
            if (subcategories.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete category',
                    details: 'Category has subcategories. Delete or reassign them first.'
                });
            }

            // Check if category is used in any transactions
            const transactions = await Transaction.find({ category: id, userId });
            if (transactions.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete category',
                    details: 'Category is used in transactions. Update or delete them first.'
                });
            }

            // Check if category is used in any budgets
            const budgets = await Budget.find({ category: id, userId });
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

    /**
     * Update category patterns
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async updateCategoryPatterns(req, res) {
        try {
            const { categoryId, patterns } = req.body;
            const userId = getAuthenticatedUserId(req);

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

    /**
     * Batch categorize transactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async batchCategorizeTransactions(req, res) {
        try {
            const { transactionIds, categoryId } = req.body;
            const userId = getAuthenticatedUserId(req);

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
