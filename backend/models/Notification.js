const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['transaction', 'budget', 'system', 'community', 'like', 'comment', 'follow'],
        default: 'system'
    },
    read: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries and auto-deletion of expired notifications
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function(userId, message, type, data = {}, priority = 'medium') {
    return this.create({
        user: userId,
        message,
        type,
        data,
        priority,
        expiresAt: type === 'system' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for non-system notifications
    });
};

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
    this.read = true;
    return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
