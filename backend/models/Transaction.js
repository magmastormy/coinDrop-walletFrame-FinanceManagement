const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: {
            values: ['income', 'expense'],
            message: 'Transaction type must be either income or expense'
        },
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
        validate: {
            validator: function(value) {
                return value >= 0;
            },
            message: 'Amount must be a positive number'
        }
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: {
            type: Number,
            min: 1,
            default: 1
        },
        endDate: Date,
        nextOccurrence: Date
    },
    attachments: [{
        type: String,
        trim: true
    }],
    // Legacy encrypted fields for backward compatibility
    amountEncrypted: {
        type: String
    },
    descriptionEncrypted: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// Indexes for Performance
// ============================================

// Compound indexes for optimized queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ categoryId: 1, date: -1 });
transactionSchema.index({ type: 1, date: -1 });

// Text index for description search
transactionSchema.index(
    { description: 'text', tags: 'text' },
    {
        name: 'transaction_text_search',
        default_language: 'english',
        weights: {
            description: 10,
            tags: 5
        }
    }
);

// Additional indexes for common query patterns
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, isRecurring: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ createdAt: -1 });

// ============================================
// Pre-save Middleware
// ============================================

transactionSchema.pre('save', function(next) {
    // Ensure date is set
    if (!this.date) {
        this.date = new Date();
    }

    // Validate recurring pattern if isRecurring is true
    if (this.isRecurring && this.recurringPattern) {
        if (!this.recurringPattern.frequency) {
            return next(new Error('Recurring pattern must have a frequency'));
        }
        if (!this.recurringPattern.nextOccurrence) {
            // Calculate next occurrence based on frequency
            this.recurringPattern.nextOccurrence = this._calculateNextOccurrence();
        }
    }

    next();
});

// Helper method to calculate next occurrence
transactionSchema.methods._calculateNextOccurrence = function() {
    const now = new Date();
    const interval = this.recurringPattern.interval || 1;

    switch (this.recurringPattern.frequency) {
        case 'daily':
            return new Date(now.setDate(now.getDate() + interval));
        case 'weekly':
            return new Date(now.setDate(now.getDate() + (interval * 7)));
        case 'monthly':
            return new Date(now.setMonth(now.getMonth() + interval));
        case 'yearly':
            return new Date(now.setFullYear(now.getFullYear() + interval));
        default:
            return new Date(now.setMonth(now.getMonth() + 1));
    }
};

// ============================================
// Static Methods
// ============================================

/**
 * Get monthly total for a user
 * @param {string} userId - The user ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2024)
 * @param {string} type - Transaction type ('income' or 'expense')
 * @returns {Promise<number>} Total amount for the month
 */
transactionSchema.statics.getMonthlyTotal = async function(userId, month, year, type) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                type: type,
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

/**
 * Get category breakdown for a user within a date range
 * @param {string} userId - The user ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of category breakdown objects
 */
transactionSchema.statics.getCategoryBreakdown = async function(userId, startDate, endDate) {
    const matchStage = {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    const breakdown = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    categoryId: '$categoryId',
                    type: '$type'
                },
                totalAmount: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
                averageAmount: { $avg: '$amount' }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id.categoryId',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        {
            $unwind: {
                path: '$categoryInfo',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                categoryId: '$_id.categoryId',
                type: '$_id.type',
                categoryName: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
                categoryColor: { $ifNull: ['$categoryInfo.color', '#6B7280'] },
                totalAmount: 1,
                transactionCount: 1,
                averageAmount: { $round: ['$averageAmount', 2] }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    return breakdown;
};

/**
 * Search transactions with multiple criteria
 * @param {string} userId - The user ID
 * @param {string} query - Search query for text search
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of matching transactions
 */
transactionSchema.statics.searchTransactions = async function(userId, query, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { date: -1 },
        type,
        categoryId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        tags
    } = options;

    const searchQuery = { userId: new mongoose.Types.ObjectId(userId) };

    // Text search on description
    if (query && query.trim()) {
        searchQuery.$text = { $search: query };
    }

    // Filter by type
    if (type) {
        searchQuery.type = type;
    }

    // Filter by category
    if (categoryId) {
        searchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    // Filter by date range
    if (startDate || endDate) {
        searchQuery.date = {};
        if (startDate) searchQuery.date.$gte = new Date(startDate);
        if (endDate) searchQuery.date.$lte = new Date(endDate);
    }

    // Filter by amount range
    if (minAmount !== undefined || maxAmount !== undefined) {
        searchQuery.amount = {};
        if (minAmount !== undefined) searchQuery.amount.$gte = minAmount;
        if (maxAmount !== undefined) searchQuery.amount.$lte = maxAmount;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
        searchQuery.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    const queryBuilder = this.find(searchQuery)
        .populate('categoryId', 'name color icon')
        .populate('walletId', 'name currency')
        .sort(sort)
        .skip(skip)
        .limit(limit);

    // Add text score if doing text search
    if (query && query.trim()) {
        queryBuilder.select({ score: { $meta: 'textScore' } });
    }

    return queryBuilder.lean();
};

/**
 * Get recurring transactions that need processing
 * @returns {Promise<Array>} Array of recurring transactions
 */
transactionSchema.statics.getDueRecurringTransactions = async function() {
    const now = new Date();

    return this.find({
        isRecurring: true,
        'recurringPattern.nextOccurrence': { $lte: now },
        $or: [
            { 'recurringPattern.endDate': { $exists: false } },
            { 'recurringPattern.endDate': { $gte: now } }
        ]
    }).populate('userId', 'username email');
};

/**
 * Get transaction statistics for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Options for statistics
 * @returns {Promise<Object>} Transaction statistics
 */
transactionSchema.statics.getTransactionStats = async function(userId, options = {}) {
    const { startDate, endDate } = options;

    const matchStage = {
        userId: new mongoose.Types.ObjectId(userId)
    };

    if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
                averageAmount: { $avg: '$amount' },
                maxAmount: { $max: '$amount' },
                minAmount: { $min: '$amount' }
            }
        }
    ]);

    const monthlyTrend = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    type: '$type'
                },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return {
        summary: stats.reduce((acc, stat) => {
            acc[stat._id] = {
                totalAmount: stat.totalAmount,
                count: stat.count,
                averageAmount: Math.round(stat.averageAmount * 100) / 100,
                maxAmount: stat.maxAmount,
                minAmount: stat.minAmount
            };
            return acc;
        }, {}),
        monthlyTrend: monthlyTrend.map(item => ({
            year: item._id.year,
            month: item._id.month,
            type: item._id.type,
            totalAmount: item.totalAmount,
            count: item.count
        })),
        generatedAt: new Date()
    };
};

// ============================================
// Instance Methods
// ============================================

/**
 * Update next occurrence for recurring transaction
 * @returns {Promise<void>}
 */
transactionSchema.methods.updateNextOccurrence = async function() {
    if (!this.isRecurring || !this.recurringPattern) {
        return;
    }

    this.recurringPattern.nextOccurrence = this._calculateNextOccurrence();
    await this.save();
};

/**
 * Check if transaction has attachments
 * @returns {boolean}
 */
transactionSchema.methods.hasAttachments = function() {
    return this.attachments && this.attachments.length > 0;
};

/**
 * Add a tag to the transaction
 * @param {string} tag - Tag to add
 * @returns {Promise<void>}
 */
transactionSchema.methods.addTag = async function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        await this.save();
    }
};

/**
 * Remove a tag from the transaction
 * @param {string} tag - Tag to remove
 * @returns {Promise<void>}
 */
transactionSchema.methods.removeTag = async function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.save();
};

// ============================================
// Virtual Fields
// ============================================

transactionSchema.virtual('isExpense').get(function() {
    return this.type === 'expense';
});

transactionSchema.virtual('isIncome').get(function() {
    return this.type === 'income';
});

transactionSchema.virtual('formattedAmount').get(function() {
    return this.amount.toFixed(2);
});

transactionSchema.virtual('hasCategory').get(function() {
    return !!this.categoryId;
});

transactionSchema.virtual('isInFuture').get(function() {
    return this.date > new Date();
});

// ============================================
// Query Helpers
// ============================================

transactionSchema.query.byUser = function(userId) {
    return this.where({ userId: new mongoose.Types.ObjectId(userId) });
};

transactionSchema.query.byType = function(type) {
    return this.where({ type });
};

transactionSchema.query.byDateRange = function(startDate, endDate) {
    return this.where({
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    });
};

transactionSchema.query.byCategory = function(categoryId) {
    return this.where({ categoryId: new mongoose.Types.ObjectId(categoryId) });
};

transactionSchema.query.recent = function(limit = 10) {
    return this.sort({ date: -1 }).limit(limit);
};

module.exports = mongoose.model('Transaction', transactionSchema);
