const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { Wallet } = require('@mui/icons-material');

class BudgetController {
    // Create a new budget
    static async createBudget(req, res) {
        console.log("Budget Controller - createBudget - req.body: ", req.body);
        try {
            const { name, amount, categoryId, walletId } = req.body;
            const userId = req.user._id || req.query.userId || req.user.userId;

            if (!name || !amount || !categoryId || !walletId) {
                return res.status(400).json({
                    error: '[BudgetController] All fields are required: name, amount, categoryId, walletId'
                });
            }

            // Validate category exists and belongs to user
            const category = await Category.findOne({
                _id: categoryId,
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

            if(!wallet)
            {
                return res.status(400).json({
                    error: '[BudgetController] Invalid wallet'
                });
            }

            const budgetData = {
                ...req.body,
                userId: userId,
            };

            const budget = new Budget(budgetData);
            await budget.save();
            await budget.populate('categoryId');

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

    // Get all budgets for a user withtional filters
    static async getUserBudgets(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const budgets = await Budget.find({ 
                userId: userId 
            })
            .populate('categoryId')
            .sort('-createdAt');
    
            res.json({ budgets });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to retrieve budgets',
                details: error.message
            });
        }
    }


        // Update a budget
    static async updateBudget(req, res) 
    {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const { id } = req.params;
            const { categoryId } = req.body;

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
            }

            const budget = await Budget.findOneAndUpdate(
                { _id: id, userId: userId },
                req.body,
                { new: true, runValidators: true }
            ).populate('categoryId');

                if (!budget) {
                    return res.status(404).json({
                        error: '[BudgetController] Budget not found'
                    });
                }

                res.json({ budget });
        } catch (error) {
            res.status(400).json({
                error: '[BudgetController] Budget update failed',
                details: error.message
            });
        }
    }


    // Delete a budget
    static async deleteBudget(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id || req.query.userId || req.user.userId;

            const budget = await Budget.findOneAndDelete({
                _id: id,
                userId: userId,
            });

            if (!budget) {
                return res.status(404).json({ 
                    error: '[BudgetController] Budget not found or unauthorized' 
                });
            }

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

    // Get budget statistics
    static async getBudgetStats(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const stats = await Budget.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' },
                {
                    $group: {
                        _id: '$status',
                        totalBudgets: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            const activeBudgets = await Budget.aggregate([
                { 
                    $match: { 
                        userId: mongoose.Types.ObjectId(userId),
                        status: 'active'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' },
                {
                    $project: {
                        name: 1,
                        amount: 1,
                        totalSpent: 1,
                        status: 1,
                        'category.name': 1
                    }
                }
            ]);

            const budgetHealth = activeBudgets.map(budget => ({
                name: budget.name,
                category: budget.category.name,
                amount: budget.amount,
                spent: budget.totalSpent || 0,
                spentPercentage: Math.round(((budget.totalSpent || 0) / budget.amount) * 100),
                status: budget.status
            }));

            res.json({ statusStats: stats, budgetHealth });
        } catch (error) {
            res.status(500).json({
                error: '[BudgetController] Failed to retrieve budget statistics',
                details: error.message
            });
        }
    }

    static async analyzeBudgetPerformance(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const performanceAnalysis = await Budget.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
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
}
module.exports = BudgetController;