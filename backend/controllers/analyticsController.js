const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

class AnalyticsController {
    // Get financial overview
    static async getFinancialOverview(req, res) {
        try {
            const userId = req.user._id;

            // Optimized: Single query with aggregation
            const [walletData, expenseData] = await Promise.all([
                Wallet.aggregate([
                    {
                        $match: { userId: mongoose.Types.ObjectId(userId) }
                    },
                    {
                        $group: {
                            _id: null,
                            totalBalance: { $sum: '$balance' }
                        }
                    }
                ]),
                Transaction.aggregate([
                    {
                        $match: {
                            userId: mongoose.Types.ObjectId(userId),
                            type: 'expense'
                        }
                    },
                    {
                        $facet: {
                            currentMonth: [
                                {
                                    $match: {
                                        date: { $gte: new Date(new Date().setDate(1)) }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        total: { $sum: '$amount' }
                                    }
                                }
                            ],
                            lastMonth: [
                                {
                                    $match: {
                                        date: {
                                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                                            $lt: new Date(new Date().setDate(1))
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        total: { $sum: '$amount' }
                                    }
                                }
                            ]
                        }
                    }
                ])
            ]);

            const totalBalance = walletData[0]?.totalBalance || 0;
            const totalExpenses = expenseData[0]?.currentMonth[0]?.total || 0;
            const lastMonthTotal = expenseData[0]?.lastMonth[0]?.total || 0;
            const expenseChange = lastMonthTotal ? 
                ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0;

            // Get income for same period
            const [incomeData] = await Transaction.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(userId),
                        type: 'income',
                        date: { $gte: new Date(new Date().setDate(1)) }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const totalSavings = (incomeData?.total || 0) - totalExpenses;

            res.json({
                totalBalance,
                totalExpenses,
                totalSavings,
                expenseChange
            });
        } catch (error) {
            res.status(500).json({
                error_code: 'ANALYTICS_FETCH_FAILED',
                message: 'Failed to retrieve financial overview',
                details: error.message
            });
        }
    }

    // Get spending trends
    static async getSpendingTrends(req, res) {
        try {
            const userId = req.user._id;
            const { timeRange = 'month' } = req.query;

            let startDate = new Date();
            switch (timeRange) {
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setMonth(startDate.getMonth() - 1);
            }

            const trends = await Transaction.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(userId),
                        type: 'expense',
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { 
                                format: timeRange === 'week' ? '%Y-%m-%d' : '%Y-%m',
                                date: '$date'
                            }
                        },
                        amount: { $sum: '$amount' }
                    }
                },
                {
                    $sort: { '_id': 1 }
                }
            ]);

            res.json(trends);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve spending trends',
                details: error.message
            });
        }
    }

    // Get category breakdown
    static async getCategoryBreakdown(req, res) {
        try {
            const userId = req.user._id;
            const { timeRange = 'month' } = req.query;

            let startDate = new Date();
            switch (timeRange) {
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setMonth(startDate.getMonth() - 1);
            }

            const breakdown = await Transaction.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(userId),
                        type: 'expense',
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        value: { $sum: '$amount' }
                    }
                },
                {
                    $project: {
                        name: '$_id',
                        value: 1,
                        _id: 0
                    }
                }
            ]);

            res.json(breakdown);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve category breakdown',
                details: error.message
            });
        }
    }

    // Get savings progress
    static async getSavingsProgress(req, res) {
        try {
            const userId = req.user._id;
            const months = 6; // Last 6 months

            let startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const progress = await Transaction.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(userId),
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$date' },
                            year: { $year: '$date' }
                        },
                        income: {
                            $sum: {
                                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                            }
                        },
                        expenses: {
                            $sum: {
                                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $dateToString: {
                                format: '%b',
                                date: {
                                    $dateFromParts: {
                                        year: '$_id.year',
                                        month: '$_id.month',
                                        day: 1
                                    }
                                }
                            }
                        },
                        target: { $multiply: ['$income', 0.2] }, // 20% of income as target
                        actual: { $subtract: ['$income', '$expenses'] }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1
                    }
                }
            ]);

            res.json(progress);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve savings progress',
                details: error.message
            });
        }
    }
}

module.exports = AnalyticsController;
