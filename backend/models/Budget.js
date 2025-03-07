const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Budget amount must be positive']
    },
    type: {
        type: String,
        enum: ['expense', 'income', 'savings'],
        required: true
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    // Add walletId field to schema
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    // Link to category
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    // Allow subcategories
    includeSubcategories: {
        type: Boolean,
        default: true
    },
    // Track actual spent amount
    spent: {
        type: Number,
        default: 0,
        min: 0
    },
    // Track committed amount (planned transactions)
    committed: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rollover: {
        enabled: {
            type: Boolean,
            default: false
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        }
    }
}, {
    timestamps: true
});

// Ensure unique budget names per user
budgetSchema.index({ userId: 1, name: 1 }, { unique: true });

// Pre-save middleware to validate category type matches budget type
budgetSchema.pre('save', async function(next) {
    if (this.isModified('category')) {
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);
        
        if (!category) {
            next(new Error('Category not found'));
            return;
        }
        
        // No type validation needed anymore
    }
    next();
});

// Static method to update budget spent amount
budgetSchema.statics.updateBudgetSpent = async function(budgetId) {
    const budget = await this.findById(budgetId);
    if (!budget) return;

    const Transaction = mongoose.model('Transaction');
    
    // Build category query
    const categoryQuery = [budget.category];
    if (budget.includeSubcategories) {
        const Category = mongoose.model('Category');
        const category = await Category.findById(budget.category);
        if (category) {
            const subcategories = await category.getAllSubcategories();
            categoryQuery.push(...subcategories.map(sub => sub._id));
        }
    }

    // Calculate total spent
    const totalSpent = await Transaction.aggregate([
        {
            $match: {
                budgetId: budget._id,
                category: { $in: categoryQuery },
                affectsBudget: true,
                date: { 
                    $gte: budget.startDate,
                    $lte: budget.endDate || new Date()
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    budget.spent = totalSpent[0]?.total || 0;
    await budget.save();
    
    return budget;
};

// Get remaining budget amount
budgetSchema.methods.getRemainingAmount = function() {
    const total = this.amount + (this.rollover.enabled ? this.rollover.amount : 0);
    return Math.max(0, total - this.spent - this.committed);
};

// Static method to get user's budgets with total spent
budgetSchema.statics.getUserBudgetsWithTotalSpent = async function(userId) {
    return this.find({ userId })
        .populate('category')
        .sort({ startDate: -1 });
};

// Add this to the budget model to handle transaction impacts
budgetSchema.methods.updateTotalSpent = async function(transactionAmount, transactionType) {
    if (transactionType === 'expense') {
        // For expenses, increase the amount spent
        this.spent = (this.spent || 0) + transactionAmount;
    } else if (transactionType === 'income' && this.type === 'income') {
        // For income transactions on income-type budgets
        this.spent = (this.spent || 0) + transactionAmount;
    } else if (transactionType === 'transfer' && this.type === 'expense') {
        // For transfers to expense budgets (adding funds)
        this.spent = Math.max(0, (this.spent || 0) - transactionAmount);
    }
    
    return this.save();
};

module.exports = mongoose.model('Budget', budgetSchema);
