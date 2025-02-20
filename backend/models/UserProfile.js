const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    bio: {
        type: String,
        maxLength: 150
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    profilePicture: String,
    coverPhoto: String,
    interests: [{
        type: String,
        enum: [
            'investing',
            'budgeting',
            'saving',
            'crypto',
            'stocks',
            'real-estate',
            'retirement',
            'taxes',
            'insurance'
        ]
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],

    activity: {
        lastActive: Date,
        totalPosts: {
            type: Number,
            default: 0
        },
        totalComments: {
            type: Number,
            default: 0
        },
        helpfulVotes: {
            type: Number,
            default: 0
        },
        reportedContent: {
            type: Number,
            default: 0
        }
    },
}, {
    timestamps: true
});

// Indexes for better query performance
userProfileSchema.index({ 'activity.lastActive': -1 });

// Instance methods
userProfileSchema.methods.follow = async function(userId) {
    if (!this.following.includes(userId)) {
        this.following.push(userId);
        await this.save();
        return true;
    }
    return false;
};

userProfileSchema.methods.unfollow = async function(userId) {
    if (this.following.includes(userId)) {
        this.following = this.following.filter(id => !id.equals(userId));
        await this.save();
        return true;
    }
    return false;
};

userProfileSchema.methods.updateActivity = async function() {
    this.activity.lastActive = new Date();
    await this.save();
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
