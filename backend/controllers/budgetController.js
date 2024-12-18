const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class BudgetController {
    // Create a new budget
    static async createBudget(req, res) {
        try {
            const budgetData = {
                ...req.body,
                userId: req.user._id || req.query.userId || req.user.userId,
            };

            const budget = new Budget(budgetData);
            await budget.save();

            res.status(201).json({
                message: 'Budget created successfully',
                budget
            });
        } catch (error) {
            res.status(400).json({
                error: 'Budget creation failed',
                details: error.message
            });
        }
    }

    // Get all budgets for a user
    static async getUserBudgets(req, res) {
        try {
            const { status, category } = req.query;

            console.log("Budget Controller - getUserBudgets - req.user.id: ", req.user. userId);
            console.log("Budget Controller - getUserBudgets - req.query.userId: ", req.query.userId);


            const filter = { 
                userId: req.query.userId || req.user.userId,
            };

            if (status) filter.status = status;
            if (category) filter.category = category;

            const budgets = await Budget.find(filter)
                .sort({ amount: -1 })
                .populate({
                    path: 'totalSpent',
                    select: 'total'
                });

            res.json({
                budgets,
                totalBudgets: budgets.length,
                totalBudgetAmount: budgets.reduce((sum, budget) => sum + budget.amount, 0)
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve budgets',
                details: error.message
            });
        }
    }

    // Update a budget
    static async updateBudget(req, res) {
        try {
            const { id } = req.params;

            // Ensure budget belongs to the user
            const budget = await Budget.findOneAndUpdate(
                { 
                    _id: id, 
                    userId: req.user._id || req.query.userId || req.user.userId, 
                },
                req.body,
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (!budget) {
                return res.status(404).json({ 
                    error: 'Budget not found or unauthorized' 
                });
            }

            res.json({
                message: 'Budget updated successfully',
                budget
            });
        } catch (error) {
            res.status(400).json({
                error: 'Budget update failed',
                details: error.message
            });
        }
    }

    // Delete a budget
    static async deleteBudget(req, res) {
        try {
            const { id } = req.params;

            const budget = await Budget.findOneAndDelete({
                _id: id,
                userId: req.user._id || req.query.userId || req.user.userId,
            });

            if (!budget) {
                return res.status(404).json({ 
                    error: 'Budget not found or unauthorized' 
                });
            }

            res.json({
                message: 'Budget deleted successfully',
                budget
            });
        } catch (error) {
            res.status(500).json({
                error: 'Budget deletion failed',
                details: error.message
            });
        }
    }

    // Get budget statistics
    static async getBudgetStats(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId ;

            const stats = await Budget.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$status',
                        totalBudgets: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            // Calculate overall budget health
            const activeBudgets = await Budget.getActiveBudgets(userId);
            const budgetHealth = activeBudgets.map(budget => {
                const spentPercentage = (budget.totalSpent / budget.amount) * 100;
                return {
                    name: budget.name,
                    category: budget.category,
                    amount: budget.amount,
                    spent: budget.totalSpent,
                    spentPercentage: Math.round(spentPercentage),
                    status: budget.status
                };
            });

            res.json({ 
                statusStats: stats,
                budgetHealth 
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve budget statistics',
                details: error.message
            });
        }
    }

    // Analyze budget performance
    static async analyzeBudgetPerformance(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const performanceAnalysis = await Budget.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'transactions',
                        let: { budgetId: '$_id', budgetCategory: '$category' },
                        pipeline: [
                            { 
                                $match: { 
                                    $expr: {
                                        $and: [
                                            { $eq: ['$userId', mongoose.Types.ObjectId(userId)] },
                                            { $eq: ['$category', '$$budgetCategory'] },
                                            { $gte: ['$date', '$startDate'] },
                                            { $lte: ['$date', '$endDate'] }
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
                    $addFields: {
                        totalSpent: { $ifNull: [{ $arrayElemAt: ['$transactions.totalSpent', 0] }, 0] },
                        overBudget: { $gt: [{ $ifNull: [{ $arrayElemAt: ['$transactions.totalSpent', 0] }, 0] }, '$amount'] }
                    }
                },
                {
                    $project: {
                        name: 1,
                        category: 1,
                        amount: 1,
                        totalSpent: 1,
                        overBudget: 1,
                        spentPercentage: {
                            $multiply: [
                                { $divide: ['$totalSpent', '$amount'] },
                                100
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
                error: 'Failed to analyze budget performance',
                details: error.message
            });
        }
    }
}

module.exports = BudgetController;
