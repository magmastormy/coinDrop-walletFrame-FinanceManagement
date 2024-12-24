const UserSettings = require('../models/UserSettings');
const bcrypt = require('bcryptjs');

class SettingsController {
    // Get user settings
    static async getUserSettings(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            let settings = await UserSettings.findOne({ userId: userId });
            
            if (!settings) {
                settings = await UserSettings.createDefaultSettings(userId);
            }

            // Remove sensitive data
            settings = settings.toObject();
            delete settings.security.transactionPin;

            res.json(settings);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve settings',
                details: error.message
            });
        }
    }

    // Update notification settings
    static async updateNotificationSettings(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const settings = await UserSettings.findOneAndUpdate(
                { userId: userId },
                { 'notifications': req.body },
                { new: true, runValidators: true }
            );

            if (!settings) {
                return res.status(404).json({
                    error: 'Settings not found'
                });
            }

            res.json({
                message: 'Notification settings updated',
                notifications: settings.notifications
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to update notification settings',
                details: error.message
            });
        }
    }

    // Update preferences
    static async updatePreferences(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const settings = await UserSettings.findOneAndUpdate(
                { userId: userId },
                { 'preferences': req.body },
                { new: true, runValidators: true }
            );

            if (!settings) {
                return res.status(404).json({
                    error: 'Settings not found'
                });
            }

            res.json({
                message: 'Preferences updated',
                preferences: settings.preferences
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to update preferences',
                details: error.message
            });
        }
    }

    // Update security settings
    static async updateSecuritySettings(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const { twoFactorAuth, biometricLogin } = req.body;
            const settings = await UserSettings.findOne({ userId: userId });

            if (!settings) {
                return res.status(404).json({
                    error: 'Settings not found'
                });
            }

            settings.security.twoFactorAuth = twoFactorAuth;
            settings.security.biometricLogin = biometricLogin;

            await settings.save();

            // Remove sensitive data before sending response
            const response = settings.toObject();
            delete response.security.transactionPin;

            res.json({
                message: 'Security settings updated',
                security: response.security
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to update security settings',
                details: error.message
            });
        }
    }

    // Verify transaction PIN
    static async verifyTransactionPin(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const { pin } = req.body;
            const settings = await UserSettings.findOne({ userId: userId})
                .select('+security.transactionPin');

            if (!settings || !settings.security.transactionPinEnabled) {
                return res.status(400).json({
                    error: 'Transaction PIN not enabled'
                });
            }

            const isValid = await bcrypt.compare(pin, settings.security.transactionPin);
            
            res.json({
                valid: isValid
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to verify PIN',
                details: error.message
            });
        }
    }
}

module.exports = SettingsController;
