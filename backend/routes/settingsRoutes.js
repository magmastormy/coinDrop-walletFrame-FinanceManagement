const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const SettingsController = require('../controllers/settingsController');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Validation middleware
const securityValidation = [
    body('twoFactorAuth').isBoolean(),
    body('biometricLogin').isBoolean(),
    body('transactionPinEnabled').isBoolean(),
    body('newPin')
        .optional()
        .isLength({ min: 4, max: 6 })
        .matches(/^\d+$/)
        .withMessage('PIN must be 4-6 digits')
];

const preferencesValidation = [
    body('language')
        .isIn(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']),
    body('theme')
        .isIn(['Light', 'Dark', 'System']),
    body('defaultCurrency')
        .isLength({ min: 3, max: 3 })
        .isUppercase()
];

const notificationValidation = [
    body('email').isBoolean(),
    body('push').isBoolean(),
    body('transactions').isBoolean(),
    body('budgetAlerts').isBoolean(),
    body('communityUpdates').isBoolean()
];

// Protect all routes
router.use(authMiddleware);

// Settings routes
router.get('/', SettingsController.getUserSettings);
router.put('/notifications', notificationValidation, SettingsController.updateNotificationSettings);
router.put('/preferences', preferencesValidation, SettingsController.updatePreferences);
router.put('/security', securityValidation, SettingsController.updateSecuritySettings);
router.post('/verify-pin', SettingsController.verifyTransactionPin);

module.exports = router;
