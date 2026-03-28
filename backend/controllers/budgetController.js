const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const { getAuthenticatedUserId } = require('../utils/authUser');
const cacheUtil = require('../utils/cacheUtil');

/**
 * Budget Controller
 * Handles budget-related operations including creation, retrieval, updating, and deletion
 */
class BudgetController {
    /**
     * Create a new budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async createBudget(req, res) {
        try {
            const { name, amount, categoryId, category: categoryInput, walletId } = req.body;
            const userId = getAuthenticatedUserId(req);
            const normalizedCategoryId = categoryInput || categoryId;
            const numericAmount = Number(amount);

            if (!name || !amount || !normalizedCategoryId || !walletId) {
                return res.status(400).json({
                    error: '[BudgetController] All fields are required: name, amount, category, walletId'
                });
            }

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({
                    error: '[BudgetController] Amount must be a positive number'
                });
            }

            // Validate category exists and belongs to user
            const category = await Category.findOne({
                _id: normalizedCategoryId,
                userId: userId
            });

            if (!category) {
                return res.status(400).json({
                    error: '[BudgetController] Invalid category'
                });
            }

            const wallet = await Wallet.findOne({
                _id: walletId,
                userId: userId
            });

            if(!wallet) {
                return res.status(400).json({
                    error: '[BudgetController] Invalid wallet'
                });
            }

            // Validate budget amount doesn't exceed wallet balance (with some flexibility)
            // Allow budgets up to 10x wallet balance for planning purposes, but warn user
            const maxRecommendedBudget = wallet.balance * 10;
            if (numericAmount > maxRecommendedBudget && numericAmount > 1000) {
                // Log warning but don't block - allow for future income planning
                console.warn(`[BudgetController] Large budget created: ${numericAmount} vs wallet balance ${wallet.balance}`);
            }

            const budgetData = {
                ...req.body,
                userId: userId,
                category: normalizedCategoryId,
                amount: numericAmount,
                automation: req.body.automation || {
                    autoCategorize: {
                        enabled: true,
                        threshold: 0.7
                    },
                    recurring: {
                        enabled: true,
                        autoRenew: true
                    },
                    alerts: {
                        enabled: true,
                        thresholds: {
                            high: 90,
                            medium: 75
                        }
                    }
                }
            };

            delete budgetData.categoryId;

            const budget = new Budget(budgetData);
            await budget.save();
            await budget.populate('category');

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            
            res.status(201).json({
                message: '[BudgetController] Budget created successfully',
                budget
            });
        } catch (error) {
            res.status(400).json({
                error: '[BudgetController] Budget creation failed',
                details: error.message
            });
        }
    }

    /**
     * Get all budgets for a user with optional filters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getUserBudgets(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const budgets = await Budget.find({ 
                userId: userId 
            })
            .populate('category')
            .sort('-createdAt');
    
            res.json({ budgets });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to retrieve budgets',
                details: error.message
            });
        }
    }


    /**
     * Update a budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async updateBudget(req, res) 
    {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            const categoryId = req.body.categoryId || req.body.category;
            const walletId = req.body.walletId;
            const amount = req.body.amount;

            if (categoryId) {
                // Validate new category if provided
                const category = await Category.findOne({
                    _id: categoryId,
                    userId: userId
                });
                    
                if (!category) {
                    return res.status(400).json({
                        error: '[BudgetController] Invalid category'
                    });
                }
                
                // Map categoryId to category for schema consistency
                req.body.category = categoryId;
                delete req.body.categoryId;
            }

            if (walletId) {
                const wallet = await Wallet.findOne({
                    _id: walletId,
                    userId,
                    isActive: true
                });
                if (!wallet) {
                    return res.status(400).json({
                        error: '[BudgetController] Invalid wallet'
                    });
                }
            }

            if (amount !== undefined) {
                const numericAmount = Number(amount);
                if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                    return res.status(400).json({
                        error: '[BudgetController] Amount must be a positive number'
                    });
                }
                req.body.amount = numericAmount;
            }

            const budget = await Budget.findOneAndUpdate(
                { _id: id, userId: userId },
                req.body,
                { new: true, runValidators: true }
            ).populate('category');

                if (!budget) {
                    return res.status(404).json({
                        error: '[BudgetController] Budget not found'
                    });
                }

                // Invalidate user context cache
                const cacheKey = cacheUtil.generateKey('user_context', userId);
                await cacheUtil.del(cacheKey);
                
                res.json({ budget });
        } catch (error) {
            res.status(400).json({
                error: '[BudgetController] Budget update failed',
                details: error.message
            });
        }
    }


    /**
     * Delete a budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async deleteBudget(req, res) {
        try {
            const { id } = req.params;
            const userId = getAuthenticatedUserId(req);

            const budget = await Budget.findOneAndDelete({
                _id: id,
                userId: userId,
            });

            if (!budget) {
                return res.status(404).json({ 
                    error: '[BudgetController] Budget not found or unauthorized' 
                });
            }

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            
            res.json({
                message: '[BudgetController] Budget deleted successfully',
                budget
            });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Budget deletion failed',
                details: error.message
            });
        }
    }

    /**
     * Get budget statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getBudgetStats(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            // Ensure userId is a valid ObjectId
            const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
                ? new mongoose.Types.ObjectId(userId) 
                : null;
            
            if (!userObjectId) {
                return res.status(400).json({
                    error: '[BudgetController] Invalid user ID format',
                    details: 'The provided user ID is not a valid MongoDB ObjectId'
                });
            }

            const stats = await Budget.aggregate([
                { $match: { userId: userObjectId } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$type',
                        totalBudgets: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            const activeBudgets = await Budget.aggregate([
                { 
                    $match: { 
                        userId: userObjectId,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        name: 1,
                        amount: 1,
                        spent: 1,
                        isActive: 1,
                        category: { $ifNull: ['$category.name', 'Uncategorized'] }
                    }
                }
            ]);

            const budgetHealth = activeBudgets.map(budget => ({
                name: budget.name,
                category: budget.category,
                amount: budget.amount,
                spent: budget.spent || 0,
                spentPercentage: budget.amount > 0 ? Math.round(((budget.spent || 0) / budget.amount) * 100) : 0,
                status: budget.isActive ? 'active' : 'inactive'
            }));

            // Return data in the format the dashboard component expects
            const chartData = activeBudgets.map(budget => ({
                category: budget.category,
                budgetAmount: budget.amount,
                actualSpent: budget.spent || 0
            }));

            res.json({ 
                statusStats: stats, 
                budgetHealth,
                chartData
            });
        } catch (error) {
            console.error(`[BudgetController] Error in getBudgetStats: ${error.message}`);
            res.status(500).json({
                error: '[BudgetController] Failed to retrieve budget statistics',
                details: error.message
            });
        }
    }

    /**
     * Analyze budget performance
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async analyzeBudgetPerformance(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            // Ensure userId is a valid ObjectId
            const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
                ? new mongoose.Types.ObjectId(userId) 
                : null;
            
            if (!userObjectId) {
                return res.status(400).json({
                    error: '[BudgetController] Invalid user ID format',
                    details: 'The provided user ID is not a valid MongoDB ObjectId'
                });
            }

            const performanceAnalysis = await Budget.aggregate([
                { $match: { userId: userObjectId } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' },
                {
                    $lookup: {
                        from: 'transactions',
                        let: { budgetId: '$_id' },
                        pipeline: [
                            { 
                                $match: { 
                                    $expr: { 
                                        $and: [
                                            { $eq: ['$budgetId', '$$budgetId'] },
                                            { $eq: ['$type', 'expense'] }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalSpent: { $sum: '$amount' }
                                }
                            }
                        ],
                        as: 'transactions'
                    }
                },
                {
                    $project: {
                        name: 1,
                        'category.name': 1,
                        amount: 1,
                        totalSpent: { $ifNull: [{ $arrayElemAt: ['$transactions.totalSpent', 0] }, 0] },
                        overBudget: {
                            $gt: [
                                { $ifNull: [{ $arrayElemAt: ['$transactions.totalSpent', 0] }, 0] },
                                '$amount'
                            ]
                        }
                    }
                }
            ]);

            res.json({
                performanceAnalysis,
                overBudgetCount: performanceAnalysis.filter(b => b.overBudget).length
            });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to analyze budget performance',
                details: error.message
            });
        }
    }

    /**
     * Renew recurring budgets
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async renewRecurringBudgets(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            // Find all active recurring budgets with automation enabled
            const budgets = await Budget.find({
                userId: userId,
                isActive: true,
                'automation.recurring.enabled': true,
                'automation.recurring.autoRenew': true
            });

            const renewedBudgets = [];
            
            for (const budget of budgets) {
                // Calculate next period start and end dates
                const now = new Date();
                const nextStartDate = new Date(budget.startDate);
                const nextEndDate = new Date(budget.endDate || now);
                
                // Determine next period based on budget period
                switch (budget.period) {
                    case 'daily':
                        nextStartDate.setDate(nextEndDate.getDate() + 1);
                        nextEndDate.setDate(nextEndDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextStartDate.setDate(nextEndDate.getDate() + 1);
                        nextEndDate.setDate(nextEndDate.getDate() + 7);
                        break;
                    case 'monthly':
                        nextStartDate.setMonth(nextEndDate.getMonth() + 1);
                        nextEndDate.setMonth(nextEndDate.getMonth() + 1);
                        nextEndDate.setDate(0); // Last day of month
                        break;
                    case 'yearly':
                        nextStartDate.setFullYear(nextEndDate.getFullYear() + 1);
                        nextEndDate.setFullYear(nextEndDate.getFullYear() + 1);
                        nextEndDate.setMonth(11, 31); // Last day of year
                        break;
                }

                // Create new budget for next period
                const newBudget = new Budget({
                    ...budget.toObject(),
                    _id: new mongoose.Types.ObjectId(),
                    startDate: nextStartDate,
                    endDate: nextEndDate,
                    spent: 0,
                    committed: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await newBudget.save();
                renewedBudgets.push(newBudget);
            }

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            
            res.json({
                message: '[BudgetController] Recurring budgets renewed successfully',
                renewedBudgets
            });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to renew recurring budgets',
                details: error.message
            });
        }
    }

    /**
     * Check budget alerts
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async checkBudgetAlerts(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            // Find all active budgets with alerts enabled
            const budgets = await Budget.find({
                userId: userId,
                isActive: true,
                'automation.alerts.enabled': true
            });

            const alerts = [];
            
            for (const budget of budgets) {
                // Calculate budget usage percentage
                const usagePercentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                
                // Get alert thresholds from budget automation settings
                const highThreshold = budget.automation?.alerts?.thresholds?.high || 90;
                const mediumThreshold = budget.automation?.alerts?.thresholds?.medium || 75;
                
                // Check if usage exceeds thresholds
                if (usagePercentage >= highThreshold) {
                    alerts.push({
                        budgetId: budget._id,
                        budgetName: budget.name,
                        usagePercentage: Math.round(usagePercentage),
                        amount: budget.amount,
                        spent: budget.spent,
                        message: `Budget "${budget.name}" is at ${Math.round(usagePercentage)}% of its limit`,
                        severity: 'high'
                    });
                } else if (usagePercentage >= mediumThreshold) {
                    alerts.push({
                        budgetId: budget._id,
                        budgetName: budget.name,
                        usagePercentage: Math.round(usagePercentage),
                        amount: budget.amount,
                        spent: budget.spent,
                        message: `Budget "${budget.name}" is at ${Math.round(usagePercentage)}% of its limit`,
                        severity: 'medium'
                    });
                }
            }

            // Create notifications for alerts
            if (alerts.length > 0) {
                const Notification = require('../models/Notification');
                for (const alert of alerts) {
                    await Notification.createNotification(
                        userId,
                        alert.message,
                        'budget',
                        {
                            budgetId: alert.budgetId,
                            usagePercentage: alert.usagePercentage,
                            amount: alert.amount,
                            spent: alert.spent
                        },
                        alert.severity
                    );
                }
            }

            res.json({
                message: '[BudgetController] Budget alerts checked successfully',
                alerts
            });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to check budget alerts',
                details: error.message
            });
        }
    }
}
module.exports = BudgetController;
