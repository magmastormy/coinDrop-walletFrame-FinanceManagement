const mongoose = require('mongoose');
const validator = require('validator');

const BudgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Budget name is required'],
        trim: true,
        minlength: [2, 'Budget name must be at least 2 characters long'],
        maxlength: [50, 'Budget name cannot exceed 50 characters']
    },
    type: {
        type: String,
        enum: {
            values: ['monthly', 'yearly', 'custom'],
            message: '{VALUE} is not a valid budget type'
        },
        default: 'monthly'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    amount: {
        type: Number,
        required: [true, 'Budget amount is required'],
        min: [0, 'Budget amount must be a positive number']
    },
    startDate: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(value) {
                return value <= this.endDate;
            },
            message: 'Start date must be before or equal to end date'
        }
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: [0, 'Total spent must be a positive number']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total spent
BudgetSchema.virtual('calculatedTotalSpent', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'budgetId',
    pipeline: [
        { 
            $match: { 
                type: 'expense' 
            } 
        },
        { 
            $group: { 
                _id: null, 
                total: { $sum: '$amount' } 
            } 
        }
    ],
    justOne: true,
    get: function(result) {
        return result ? result.total : 0;
    }
});

// Method to update total spent
BudgetSchema.methods.updateTotalSpent = async function(amount) {
    this.totalSpent += amount;
    await this.save();
    return this.totalSpent;
};

// Static method to get user's budgets
BudgetSchema.statics.getUserBudgets = async function(userId) {
    return this.find({ userId })
        .populate('walletId')
        .sort({ startDate: 1 });
};

// Static method to get user's budgets with total spent
BudgetSchema.statics.getUserBudgetsWithTotalSpent = async function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: 'transactions',
                let: { budgetId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$budgetId', '$$budgetId'] } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ],
                as: 'totalSpent'
            }
        },
        { $project: { name: 1, type: 1, category: 1, amount: 1, startDate: 1, endDate: 1, currency: 1, isRecurring: 1, walletId: 1, totalSpent: { $arrayElemAt: ['$totalSpent.total', 0] } } }
    ]);
};

const Budget = mongoose.model('Budget', BudgetSchema);

module.exports = Budget;
