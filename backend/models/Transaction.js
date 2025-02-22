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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    description: {
        type: String,
        default: '',
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
        type: Date,
        default: Date.now
    },
    budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget',
        required: false
    },
    autoCategorized: {
        type: Boolean,
        default: false
    },
    affectsBudget: {
        type: Boolean,
        default: true
    },
    recurringTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecurringTransaction'
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: function() { return !this.savingsAccountId; }
    },
    savingsAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SavingsAccount',
        required: function() { return !this.walletId; }
    },
    fromWalletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    toWalletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    }
}, {
    timestamps: true
});

// Pre-save middleware to validate budget category
transactionSchema.pre('save', async function(next) {
    if (this.budgetId && this.isModified('category')) {
        const Budget = mongoose.model('Budget');
        const budget = await Budget.findById(this.budgetId);
        
        if (!budget) {
            next(new Error('Budget not found'));
            return;
        }

        // Ensure transaction category matches budget category
        if (budget.categoryId && !this.category.equals(budget.categoryId)) {
            next(new Error('Transaction category must match budget category'));
            return;
        }
    }
    next();
});

// Post-save middleware to update budget spent amount
transactionSchema.post('save', async function(doc) {
    if (doc.budgetId && doc.affectsBudget) {
        const Budget = mongoose.model('Budget');
        await Budget.updateBudgetSpent(doc.budgetId);
    }
});

// Static method to get transactions by category
transactionSchema.statics.getTransactionsByCategory = async function(categoryId, options = {}) {
    const query = { 
        $or: [
            { category: categoryId },
            { subcategory: categoryId }
        ]
    };
    
    if (options.startDate) query.date = { $gte: options.startDate };
    if (options.endDate) query.date = { ...query.date, $lte: options.endDate };
    if (options.userId) query.userId = options.userId;
    
    return this.find(query)
        .populate('category subcategory')
        .sort({ date: -1 });
};

// Static method to get transactions by budget
transactionSchema.statics.getTransactionsByBudget = async function(budgetId, options = {}) {
    const query = { budgetId, affectsBudget: true };
    
    if (options.startDate) query.date = { $gte: options.startDate };
    if (options.endDate) query.date = { ...query.date, $lte: options.endDate };
    
    return this.find(query)
        .populate('category subcategory')
        .sort({ date: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
