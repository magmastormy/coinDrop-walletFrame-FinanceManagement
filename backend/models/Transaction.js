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
        required: true,
        min: [0, 'Amount must be a positive number']
    },
    category: {
        type: String,
        required: true
    },
    subcategory: String,
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },

    date: {
        type: Date,
        default: Date.now
    },

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
        ref: 'Budget',
        required: true
    },
}, {
    timestamps: true
});

// Create indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ walletId: 1 });
transactionSchema.index({ 'location.coordinates': '2dsphere' });

// Static method to get transactions by budget
TransactionSchema.statics.getTransactionsByBudget = async function(budgetId) {
    return this.find({ budgetId }).sort({ date: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
