const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.query.userId || req.user.userId;
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        console.error('Error getting notifications:', err);
        res.status(500).json({ message: 'Failed to get notifications' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error marking notification as read:', err);
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
        console.error('Error creating notification:', err);
        throw err;
    }
};
