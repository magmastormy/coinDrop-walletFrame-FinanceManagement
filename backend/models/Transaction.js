const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    category: {
        type: String,
        required: true
    },
    subcategory: String,
    description: String,
    date: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },

    attachments: [{
        type: String // URLs to receipt images or documents
    }],
    recurringTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecurringTransaction'
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget'
    },
    metadata: {
        type: Map,
        of: String
    },
    // Analytics metadata
    analytics: {
        categoryTrend: {
            monthlyAverage: Number,
            percentageChange: Number,
            comparisonPeriod: String
        },
        budgetImpact: {
            budgetName: String,
            percentageOfBudget: Number,
            remainingBudget: Number
        },
        savingsMetrics: {
            potentialSavings: Number,
            similarTransactionsAvg: Number,
            recommendations: [String]
        },
        aiInsights: {
            spendingPattern: String,
            suggestedCategory: String,
            anomalyScore: Number,
            confidenceScore: Number
        }
    },
    // Merchant information
    merchant: {
        name: String,
        category: String,
        logo: String,
        frequencyVisited: Number,
        averageSpend: Number
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ walletId: 1 });
transactionSchema.index({ 'location.coordinates': '2dsphere' });

// Static methods for analytics
transactionSchema.statics.getSpendingTrends = async function(userId, period) {
    const trends = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $group: {
            _id: { 
                category: "$category",
                month: { $month: "$date" },
                year: { $year: "$date" }
            },
            total: { $sum: "$amount" }
        }},
        { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);
    return trends;
};

transactionSchema.statics.getMerchantAnalytics = async function(userId) {
    const analytics = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $group: {
            _id: "$merchant.name",
            totalSpent: { $sum: "$amount" },
            frequency: { $sum: 1 },
            averageSpend: { $avg: "$amount" }
        }},
        { $sort: { totalSpent: -1 } }
    ]);
    return analytics;
};

module.exports = mongoose.model('Transaction', transactionSchema);
