const mongoose = require('mongoose');

const SavingsRuleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'savingsgoal',
        required: true
    },
    saveBudgetUnderflow: {
        type: Boolean,
        default: false
    },
    savePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 50
    },
    roundUpTransactions: {
        type: Boolean,
        default: false
    },
    savingsPriority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastExecuted: {
        type: Date
    }
});

// Index for faster queries
SavingsRuleSchema.index({ userId: 1, goalId: 1 });

module.exports = mongoose.model('savingsrule', SavingsRuleSchema);
