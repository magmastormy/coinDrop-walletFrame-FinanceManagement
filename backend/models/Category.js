const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    icon: {
        type: String,
        default: 'default-icon'
    },
    color: {
        type: String,
        default: '#000000'
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    description: String,
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Create indexes
categorySchema.index({ name: 1, type: 1 });
categorySchema.index({ parentId: 1 });

// Static method to get full category hierarchy
categorySchema.statics.getHierarchy = async function() {
    const categories = await this.find({ parentId: null }).lean();
    
    const populateSubcategories = async (category) => {
        const subcategories = await this.find({ parentId: category._id }).lean();
        if (subcategories.length > 0) {
            category.subcategories = await Promise.all(
                subcategories.map(populateSubcategories)
            );
        }
        return category;
    };

    return Promise.all(categories.map(populateSubcategories));
};

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
    return [
        // Income Categories
        {
            name: 'Salary',
            type: 'income',
            icon: 'wallet',
            isDefault: true
        },
        {
            name: 'Investment',
            type: 'income',
            icon: 'chart-line',
            isDefault: true
        },
        {
            name: 'Business',
            type: 'income',
            icon: 'briefcase',
            isDefault: true
        },
        {
            name: 'Other Income',
            type: 'income',
            icon: 'plus-circle',
            isDefault: true
        },

        // Expense Categories
        {
            name: 'Housing',
            type: 'expense',
            icon: 'home',
            isDefault: true
        },
        {
            name: 'Transportation',
            type: 'expense',
            icon: 'car',
            isDefault: true
        },
        {
            name: 'Food',
            type: 'expense',
            icon: 'utensils',
            isDefault: true
        },
        {
            name: 'Utilities',
            type: 'expense',
            icon: 'bolt',
            isDefault: true
        },
        {
            name: 'Healthcare',
            type: 'expense',
            icon: 'medkit',
            isDefault: true
        },
        {
            name: 'Entertainment',
            type: 'expense',
            icon: 'film',
            isDefault: true
        },
        {
            name: 'Shopping',
            type: 'expense',
            icon: 'shopping-cart',
            isDefault: true
        },
        {
            name: 'Education',
            type: 'expense',
            icon: 'graduation-cap',
            isDefault: true
        },
        {
            name: 'Savings',
            type: 'expense',
            icon: 'piggy-bank',
            isDefault: true
        },
        {
            name: 'Other Expenses',
            type: 'expense',
            icon: 'ellipsis-h',
            isDefault: true
        }
    ];
};

module.exports = mongoose.model('Category', categorySchema);
