const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    type: {
        type: String,
        required: [true, 'Category type is required'],
        enum: {
            values: ['income', 'expense'],
            message: 'Category type must be either income or expense'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    color: {
        type: String,
        default: '#3B82F6',
        validate: {
            validator: function(value) {
                // Validate hex color format
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
            },
            message: 'Color must be a valid hex color code (e.g., #3B82F6)'
        }
    },
    icon: {
        type: String,
        trim: true,
        default: 'default'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [255, 'Description cannot exceed 255 characters']
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
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, name: 1 });

// Index for parent-child relationships
categorySchema.index({ parentId: 1 });

// Index for active categories lookup
categorySchema.index({ userId: 1, isActive: 1 });

// Index for default categories
categorySchema.index({ isDefault: 1, type: 1 });

// Text index for category name search
categorySchema.index(
    { name: 'text', description: 'text' },
    {
        name: 'category_text_search',
        default_language: 'english',
        weights: {
            name: 10,
            description: 3
        }
    }
);

// ============================================
// Pre-save Middleware
// ============================================

categorySchema.pre('save', function(next) {
    // Ensure name is properly trimmed
    if (this.name) {
        this.name = this.name.trim();
    }

    // Validate that a category cannot be its own parent
    if (this.parentId && this.parentId.equals(this._id)) {
        return next(new Error('A category cannot be its own parent'));
    }

    next();
});

// ============================================
// Instance Methods
// ============================================

/**
 * Get all subcategories (direct children) of this category
 * @returns {Promise<Array>} Array of subcategory documents
 */
categorySchema.methods.getSubcategories = async function() {
    return this.model('Category').find({
        parentId: this._id,
        isActive: true
    }).sort({ name: 1 }).lean();
};

/**
 * Get all descendant categories (recursive)
 * @returns {Promise<Array>} Array of all descendant categories
 */
categorySchema.methods.getAllDescendants = async function() {
    const descendants = [];
    const queue = [this._id];

    while (queue.length > 0) {
        const parentId = queue.shift();
        const children = await this.model('Category').find({
            parentId: parentId,
            isActive: true
        });

        for (const child of children) {
            descendants.push(child);
            queue.push(child._id);
        }
    }

    return descendants;
};

/**
 * Get transaction count for this category
 * @param {Object} options - Options for counting (date range, etc.)
 * @returns {Promise<number>} Number of transactions
 */
categorySchema.methods.getTransactionCount = async function(options = {}) {
    const Transaction = mongoose.model('Transaction');

    const query = {
        $or: [
            { categoryId: this._id },
            { category: this._id }  // Support both field names for backward compatibility
        ]
    };

    if (options.startDate || options.endDate) {
        query.date = {};
        if (options.startDate) query.date.$gte = new Date(options.startDate);
        if (options.endDate) query.date.$lte = new Date(options.endDate);
    }

    if (options.type) {
        query.type = options.type;
    }

    return Transaction.countDocuments(query);
};

/**
 * Get total amount for transactions in this category
 * @param {Object} options - Options for calculation
 * @returns {Promise<number>} Total amount
 */
categorySchema.methods.getTotalAmount = async function(options = {}) {
    const Transaction = mongoose.model('Transaction');

    const matchStage = {
        $or: [
            { categoryId: this._id },
            { category: this._id }
        ]
    };

    if (options.startDate || options.endDate) {
        matchStage.date = {};
        if (options.startDate) matchStage.date.$gte = new Date(options.startDate);
        if (options.endDate) matchStage.date.$lte = new Date(options.endDate);
    }

    if (options.type) {
        matchStage.type = options.type;
    }

    const result = await Transaction.aggregate([
        { $match: matchStage },
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
 * Check if this category has any transactions
 * @returns {Promise<boolean>}
 */
categorySchema.methods.hasTransactions = async function() {
    const count = await this.getTransactionCount();
    return count > 0;
};

/**
 * Get the full path of category names (parent > child > grandchild)
 * @returns {Promise<string>} Full category path
 */
categorySchema.methods.getFullPath = async function() {
    const path = [this.name];
    let current = this;

    while (current.parentId) {
        current = await this.model('Category').findById(current.parentId);
        if (current) {
            path.unshift(current.name);
        } else {
            break;
        }
    }

    return path.join(' > ');
};

// ============================================
// Static Methods
// ============================================

/**
 * Get category hierarchy for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Options for hierarchy retrieval
 * @returns {Promise<Array>} Array of root categories with children nested
 */
categorySchema.statics.getCategoryHierarchy = async function(userId, options = {}) {
    const { type, includeInactive = false } = options;

    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (type) query.type = type;
    if (!includeInactive) query.isActive = true;

    const categories = await this.find(query).sort({ name: 1 }).lean();
    const categoryMap = {};
    const roots = [];

    // Create map of all categories
    categories.forEach(cat => {
        categoryMap[cat._id.toString()] = {
            ...cat,
            children: []
        };
    });

    // Build hierarchy
    categories.forEach(cat => {
        if (cat.parentId && categoryMap[cat.parentId.toString()]) {
            categoryMap[cat.parentId.toString()].children.push(categoryMap[cat._id.toString()]);
        } else {
            roots.push(categoryMap[cat._id.toString()]);
        }
    });

    return roots;
};

/**
 * Get default categories by type
 * @param {string} type - Category type ('income' or 'expense')
 * @returns {Promise<Array>} Array of default categories
 */
categorySchema.statics.getDefaultCategories = async function(type) {
    const query = { isDefault: true };
    if (type) query.type = type;

    return this.find(query).sort({ name: 1 }).lean();
};

/**
 * Search categories by name
 * @param {string} userId - The user ID
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of matching categories
 */
categorySchema.statics.searchCategories = async function(userId, searchTerm, options = {}) {
    const { type, limit = 20, includeInactive = false } = options;

    const query = {
        userId: new mongoose.Types.ObjectId(userId),
        $text: { $search: searchTerm }
    };

    if (type) query.type = type;
    if (!includeInactive) query.isActive = true;

    return this.find(query)
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
};

/**
 * Create default categories for a new user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of created categories
 */
categorySchema.statics.createDefaultCategories = async function(userId) {
    const defaultCategories = [
        // Income categories
        { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
        { name: 'Freelance', type: 'income', color: '#3B82F6', icon: 'laptop' },
        { name: 'Investments', type: 'income', color: '#8B5CF6', icon: 'trending-up' },
        { name: 'Gifts', type: 'income', color: '#F59E0B', icon: 'gift' },
        { name: 'Other Income', type: 'income', color: '#6B7280', icon: 'plus-circle' },

        // Expense categories
        { name: 'Housing', type: 'expense', color: '#EF4444', icon: 'home' },
        { name: 'Food', type: 'expense', color: '#F97316', icon: 'utensils' },
        { name: 'Transportation', type: 'expense', color: '#3B82F6', icon: 'car' },
        { name: 'Utilities', type: 'expense', color: '#06B6D4', icon: 'zap' },
        { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: 'film' },
        { name: 'Healthcare', type: 'expense', color: '#EC4899', icon: 'heart' },
        { name: 'Shopping', type: 'expense', color: '#F59E0B', icon: 'shopping-bag' },
        { name: 'Education', type: 'expense', color: '#10B981', icon: 'book' },
        { name: 'Travel', type: 'expense', color: '#6366F1', icon: 'plane' },
        { name: 'Other Expense', type: 'expense', color: '#6B7280', icon: 'minus-circle' }
    ];

    const createdCategories = [];

    for (const catData of defaultCategories) {
        const category = new this({
            ...catData,
            userId: new mongoose.Types.ObjectId(userId),
            isDefault: true
        });
        await category.save();
        createdCategories.push(category);
    }

    return createdCategories;
};

/**
 * Get category statistics for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Options for statistics
 * @returns {Promise<Object>} Category statistics
 */
categorySchema.statics.getCategoryStats = async function(userId, options = {}) {
    const { type, startDate, endDate } = options;

    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (type) query.type = type;

    const categories = await this.find(query).lean();
    const stats = [];

    for (const category of categories) {
        const categoryInstance = new this(category);
        const transactionCount = await categoryInstance.getTransactionCount({ startDate, endDate });
        const totalAmount = await categoryInstance.getTotalAmount({ startDate, endDate, type: category.type });

        stats.push({
            categoryId: category._id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            isActive: category.isActive,
            transactionCount,
            totalAmount
        });
    }

    // Sort by total amount descending
    stats.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
        totalCategories: categories.length,
        activeCategories: categories.filter(c => c.isActive).length,
        categories: stats,
        generatedAt: new Date()
    };
};

// ============================================
// Virtual Fields
// ============================================

categorySchema.virtual('isRoot').get(function() {
    return !this.parentId;
});

categorySchema.virtual('hasParent').get(function() {
    return !!this.parentId;
});

categorySchema.virtual('displayName').get(function() {
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
});

// ============================================
// Query Helpers
// ============================================

categorySchema.query.byUser = function(userId) {
    return this.where({ userId: new mongoose.Types.ObjectId(userId) });
};

categorySchema.query.byType = function(type) {
    return this.where({ type });
};

categorySchema.query.active = function() {
    return this.where({ isActive: true });
};

categorySchema.query.roots = function() {
    return this.where({ parentId: null });
};

categorySchema.query.withChildren = function() {
    return this.where({ parentId: { $ne: null } });
};

module.exports = mongoose.model('Category', categorySchema);
