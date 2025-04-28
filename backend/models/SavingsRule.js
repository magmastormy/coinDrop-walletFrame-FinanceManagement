const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const savingsRuleSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    goalId: {
        type: Schema.Types.ObjectId,
        ref: 'SavingsGoal',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    active: {
        type: Boolean,
        default: true
    },
    triggerType: {
        type: String,
        enum: ['income', 'expense', 'scheduled', 'roundUp', 'budgetUnderflow'],
        required: true
    },
    savePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 10
    },
    saveBudgetUnderflow: {
        type: Boolean,
        default: false
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
    scheduleFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'],
        default: 'none'
    },
    scheduleDay: Number,
    scheduleAmount: Number,
    sourceWalletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    lastExecuted: Date
}, {
    timestamps: true
});

// Index for faster queries
savingsRuleSchema.index({ userId: 1, goalId: 1 });

module.exports = mongoose.model('SavingsRule', savingsRuleSchema);
