const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const UserProfile = require('../models/UserProfile');
const AnalyticsController = require('../controllers/analyticsController');
const { query } = require('express-validator');

const router = express.Router();

// Validation middleware
const timeRangeValidation = [
    query('timeRange')
        .optional()
        .isIn(['week', 'month', 'quarter', 'year'])
        .withMessage('Invalid time range')
];

// Protect all routes
router.use(authMiddleware);

// Analytics routes
router.get('/overview', AnalyticsController.getFinancialOverview);
router.get('/spending-trends', timeRangeValidation, AnalyticsController.getSpendingTrends);
router.get('/category-breakdown', timeRangeValidation, AnalyticsController.getCategoryBreakdown);
router.get('/savings-progress', AnalyticsController.getSavingsProgress);

// Legacy routes
router.get('/merchant-analytics', async (req, res) => {
    try {
        const analytics = await Transaction.getMerchantAnalytics(req.user._id);
        res.json({ analytics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/budget-insights', async (req, res) => {
    try {
        const transactions = await Transaction.aggregate([
            { $match: { userId: req.user._id } },
            { $group: {
                _id: '$budgetId',
                totalSpent: { $sum: '$amount' },
                transactionCount: { $sum: 1 }
            }},
            { $lookup: {
                from: 'budgets',
                localField: '_id',
                foreignField: '_id',
                as: 'budget'
            }},
            { $unwind: '$budget' }
        ]);

        res.json({ insights: transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/savings-recommendations', async (req, res) => {
    try {
        const transactions = await Transaction.aggregate([
            { $match: { 
                userId: req.user._id,
                type: 'expense'
            }},
            { $group: {
                _id: '$category',
                totalSpent: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' },
                frequency: { $sum: 1 }
            }},
            { $sort: { totalSpent: -1 } }
        ]);

        const recommendations = transactions.map(t => ({
            category: t._id,
            totalSpent: t.totalSpent,
            averageAmount: t.averageAmount,
            frequency: t.frequency,
            recommendations: [
                t.averageAmount > 100 ? 'Consider reducing frequency of these expenses' : null,
                t.frequency > 10 ? 'Look for bulk purchase options to save money' : null,
                'Compare prices across different vendors'
            ].filter(Boolean)
        }));

        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/financial-health', async (req, res) => {
    try {
        const [transactions, profile] = await Promise.all([
            Transaction.find({ userId: req.user._id }),
            UserProfile.findOne({ user: req.user._id })
        ]);

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        const expenseCategories = new Set(transactions.map(t => t.category)).size;
        const recurringExpenses = transactions.filter(t => t.recurringTransactionId).length;

        const healthScore = Math.min(100, Math.max(0,
            savingsRate * 0.4 +
            (expenseCategories > 5 ? 20 : expenseCategories * 4) +
            (recurringExpenses < 5 ? 20 : 100 / recurringExpenses) +
            20
        ));

        res.json({
            healthScore,
            metrics: {
                savingsRate,
                expenseDiversity: expenseCategories,
                recurringExpenses,
                monthlyIncome: income / 12,
                monthlyExpenses: expenses / 12
            },
            recommendations: [
                savingsRate < 20 ? 'Try to increase your savings rate to at least 20%' : null,
                expenseCategories < 5 ? 'Consider diversifying your expenses' : null,
                recurringExpenses > 10 ? 'Review your recurring expenses for potential savings' : null
            ].filter(Boolean)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/community-comparison', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ user: req.user._id });
        
        const communityMetrics = await Transaction.aggregate([
            { $lookup: {
                from: 'userprofiles',
                localField: 'userId',
                foreignField: 'user',
                as: 'profile'
            }},
            { $unwind: '$profile' },
            { $match: {
                'profile.financialProfile.riskTolerance': userProfile.financialProfile.riskTolerance
            }},
            { $group: {
                _id: '$type',
                averageAmount: { $avg: '$amount' },
                totalUsers: { $addToSet: '$userId' }
            }}
        ]);

        res.json({
            communityMetrics,
            percentileRank: {
                savings: 75,
                spending: 50,
                investment: 60
            },
            recommendations: [
                'Your saving rate is above average',
                'Consider reducing spending in entertainment category',
                'Your investment strategy aligns with community trends'
            ]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
