const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: String,
    // Add parent category support
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    // Track if this is a root category
    isRoot: {
        type: Boolean,
        default: true
    },
    // Icon for UI display
    icon: {
        type: String,
        default: 'default'
    },
    // Color for UI display
    color: {
        type: String,
        default: '#000000'
    },
    // Track if category is active
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure unique category names per user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Pre-save middleware to update isRoot
categorySchema.pre('save', function(next) {
    this.isRoot = !this.parentId;
    next();
});

// Static method to get category hierarchy
categorySchema.statics.getCategoryHierarchy = async function(userId) {
    const categories = await this.find({ userId });
    const categoryMap = {};
    const roots = [];

    // Create map of all categories
    categories.forEach(cat => {
        categoryMap[cat._id] = {
            ...cat.toObject(),
            children: []
        };
    });

    // Build hierarchy
    categories.forEach(cat => {
        if (cat.parentId && categoryMap[cat.parentId]) {
            categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
        } else {
            roots.push(categoryMap[cat._id]);
        }
    });

    return roots;
};

// Get all subcategories (recursive)
categorySchema.methods.getAllSubcategories = async function() {
    const subcategories = await this.model('Category').find({ parentId: this._id });
    let allSubcategories = [...subcategories];
    
    for (const subcat of subcategories) {
        const childSubcategories = await subcat.getAllSubcategories();
        allSubcategories = allSubcategories.concat(childSubcategories);
    }
    
    return allSubcategories;
};

module.exports = mongoose.model('Category', categorySchema);