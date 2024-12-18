const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxLength: 500
    },
    media: [{
        type: {
            type: String,
            enum: ['image', 'video'],
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    category: {
        type: String,
        enum: ['discussion', 'question', 'guide', 'news', 'event'],
        default: 'discussion'
    },
    topic: {
        type: String,
        enum: ['investing', 'budgeting', 'saving', 'crypto', 'stocks', 'real-estate'],
        required: true
    },
    tags: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxLength: 200
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    stats: {
        likesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        sharesCount: { type: Number, default: 0 },
        viewsCount: { type: Number, default: 0 }
    },
    visibility: {
        type: String,
        enum: ['public', 'followers'],
        default: 'public'
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'reported', 'removed'],
        default: 'active'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    lastEditedAt: Date,
    editHistory: [{
        content: String,
        editedAt: Date
    }]
}, {
    timestamps: true
});

// Pre-save middleware to update counts
postSchema.pre('save', function(next) {
    if (this.isModified('likes')) {
        this.stats.likesCount = this.likes.length;
    }
    if (this.isModified('comments')) {
        this.stats.commentsCount = this.comments.length;
    }
    next();
});

// Instance methods
postSchema.methods.like = async function(userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId);
        await this.save();
        return true;
    }
    return false;
};

postSchema.methods.unlike = async function(userId) {
    if (this.likes.includes(userId)) {
        this.likes = this.likes.filter(id => !id.equals(userId));
        await this.save();
        return true;
    }
    return false;
};

postSchema.methods.addComment = async function(userId, content) {
    this.comments.push({
        author: userId,
        content
    });
    await this.save();
    return this.comments[this.comments.length - 1];
};

postSchema.methods.removeComment = async function(commentId) {
    const commentIndex = this.comments.findIndex(c => c._id.equals(commentId));
    if (commentIndex > -1) {
        this.comments.splice(commentIndex, 1);
        await this.save();
        return true;
    }
    return false;
};

postSchema.methods.incrementViews = async function() {
    this.stats.viewsCount += 1;
    await this.save();
};

postSchema.methods.edit = async function(newContent) {
    if (this.content !== newContent) {
        // Store the old content in edit history
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
        this.content = newContent;
        this.lastEditedAt = new Date();
        await this.save();
        return true;
    }
    return false;
};

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
