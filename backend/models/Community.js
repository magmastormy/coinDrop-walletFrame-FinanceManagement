const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CommunityPostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    category: {
        type: String,
        enum: [
            'Finance Tips', 
            'Investment Advice', 
            'Budgeting', 
            'Debt Management', 
            'Savings Strategies', 
            'General Discussion'
        ],
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [CommentSchema],
    attachments: [{
        type: String, // URL or file path
        trim: true
    }],
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    communityBudget: {
        title: {
            type: String,
            required: [true, 'Budget title is required'],
            trim: true,
            minlength: [2, 'Budget title must be at least 2 characters'],
            maxlength: [100, 'Budget title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        totalBudget: {
            type: Number,
            required: [true, 'Total budget amount is required'],
            min: [0, 'Budget amount must be positive']
        },
        currentFunds: {
            type: Number,
            default: 0,
            min: [0, 'Current funds cannot be negative']
        },
        contributors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        targetDate: {
            type: Date,
            required: [true, 'Target date is required']
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active'
        },
        contributions: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            amount: {
                type: Number,
                required: true,
                min: [0, 'Contribution amount must be positive']
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for comment count
CommunityPostSchema.virtual('commentCount').get(function() {
    return this.comments.length;
});

// Virtual for like count
CommunityPostSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Indexes for performance
CommunityPostSchema.index({ author: 1, createdAt: -1 });
CommunityPostSchema.index({ category: 1 });

// Pre-save middleware
CommunityPostSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get posts by category
CommunityPostSchema.statics.getPostsByCategory = function(category, limit = 10) {
    return this.find({ category })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'username profilePicture');
};

// Static method to search posts
CommunityPostSchema.statics.searchPosts = function(query) {
    return this.find({
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } }
        ]
    })
    .sort({ createdAt: -1 })
    .populate('author', 'username profilePicture');
};

const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

module.exports = CommunityPost;
