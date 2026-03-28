const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

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
        type: String,
        required: true
    },
    amountDecrypted: {
        type: Number,
        required: true
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
        default: ''
    },
    descriptionDecrypted: {
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
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Indexes for performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, walletId: 1 });
transactionSchema.index({ userId: 1, budgetId: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ date: -1, type: 1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ walletId: 1, date: -1 });
transactionSchema.index({ budgetId: 1, date: -1 });
transactionSchema.index({ type: 1, date: -1 });

// Validator: require either category or description for AI categorization
transactionSchema.pre('validate', function(next) {
  if (!this.category && (!this.description || this.description.trim() === '')) {
    this.invalidate('description', 'Must supply a category or description');
  }
  next();
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
        if (budget.category && this.category && !this.category.equals(budget.category)) {
            next(new Error('Transaction category must match budget category'));
            return;
        }
    }
    next();
});

// Pre-save middleware to encrypt sensitive fields
transactionSchema.pre('save', function(next) {
    // Encrypt amount if it's a number or unencrypted string
    if (typeof this.amount === 'number') {
        this.amountDecrypted = this.amount;
        this.amount = encrypt(this.amount.toString());
    } else if (typeof this.amount === 'string' && !this.isEncrypted(this.amount)) {
        // If amount is a string but not encrypted, encrypt it
        this.amountDecrypted = parseFloat(this.amount);
        this.amount = encrypt(this.amount);
    }
    
    // Encrypt description if it's not already encrypted
    if (this.description && !this.isEncrypted(this.description)) {
        this.descriptionDecrypted = this.description;
        this.description = encrypt(this.description);
    }
    
    next();
});

// Helper method to check if a value is encrypted
transactionSchema.methods.isEncrypted = function(value) {
    if (!value || typeof value !== 'string') return false;
    // Check if it matches the encrypted format: base64IV:encryptedData
    const parts = value.split(':');
    if (parts.length !== 2) return false;
    try {
        // Try to decode as base64 to verify format
        Buffer.from(parts[0], 'base64');
        return true;
    } catch (e) {
        return false;
    }
};

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

// Virtual fields for decrypted values
transactionSchema.virtual('decryptedAmount').get(function() {
    return this.amountDecrypted || (this.amount ? parseFloat(decrypt(this.amount)) : 0);
});

transactionSchema.virtual('decryptedDescription').get(function() {
    return this.descriptionDecrypted || (this.description ? decrypt(this.description) : '');
});

// Ensure virtuals are included in JSON output
transactionSchema.set('toJSON', {
    virtuals: true
});

transactionSchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
