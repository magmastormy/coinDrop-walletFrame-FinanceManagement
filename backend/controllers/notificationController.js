const logger = require('../utils/logger');

const Notification = require('../models/Notification');
const User = require('../models/User');
const { getAuthenticatedUserId } = require('../utils/authUser');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        logger.error('Error getting notifications:', err);
        res.status(500).json({ message: 'Failed to get notifications' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const userId = getAuthenticatedUserId(req);
        const notification = await Notification.findOne({ _id: notificationId, user: userId });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();
        
        res.json({ success: true });
    } catch (err) {
        logger.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

// Create notification (internal use)
exports.createNotification = async (userId, message, type = 'general') => {
    try {
        
        const notification = new Notification({
            user: userId,
            message,
            type,
            read: false,
            createdAt: new Date()
        });
        
        await notification.save();
        return notification;
    } catch (err) {
        logger.error('Error creating notification:', err);
        throw err;
    }
};
