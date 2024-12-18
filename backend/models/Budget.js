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
    category: {
        type: String,
        required: [true, 'Budget category is required'],
        trim: true
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
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        validate: {
            validator: (value) => validator.isISO4217(value),
            message: 'Invalid currency code'
        }
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    frequency: {
        type: String,
        enum: {
            values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
            message: '{VALUE} is not a valid frequency'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'completed', 'exceeded', 'archived'],
            message: '{VALUE} is not a valid status'
        },
        default: 'active'
    },
    metadata: {
        icon: {
            type: String,
            default: 'budget'
        },
        color: {
            type: String,
            default: '#007bff'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total spent
BudgetSchema.virtual('totalSpent', {
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

// Method to check budget status
BudgetSchema.methods.checkStatus = function() {
    const now = new Date();
    const isExpired = now > this.endDate;
    const isExceeded = this.totalSpent > this.amount;

    if (isExpired) {
        this.status = 'completed';
    } else if (isExceeded) {
        this.status = 'exceeded';
    }

    return this.status;
};

// Static method to get user's active budgets
BudgetSchema.statics.getActiveBudgets = async function(userId) {
    return this.find({ 
        userId, 
        status: 'active',
        endDate: { $gte: new Date() }
    }).sort({ amount: -1 });
};

const Budget = mongoose.model('Budget', BudgetSchema);

module.exports = Budget;
