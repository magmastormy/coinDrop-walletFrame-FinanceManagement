const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const SettingsController = require('../controllers/settingsController');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');

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
        .optional()
        .isIn(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']),
    body('theme')
        .optional()
        .isIn(['Light', 'Dark', 'System']),
    body('defaultCurrency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .isUppercase()
];

const notificationValidation = [
    body('email').optional().isBoolean(),
    body('push').optional().isBoolean(),
    body('transactions').optional().isBoolean(),
    body('budgetAlerts').optional().isBoolean(),
    body('communityUpdates').optional().isBoolean()
];

// Protect all routes
router.use(authMiddleware);
router.use(sanitizationMiddleware);

// Settings routes
router.get('/', sanitizationMiddleware, SettingsController.getUserSettings);
router.put('/notifications', sanitizationMiddleware, notificationValidation, validationMiddleware, SettingsController.updateNotificationSettings);
router.put('/preferences', sanitizationMiddleware, preferencesValidation, validationMiddleware, SettingsController.updatePreferences);
router.put('/security', sanitizationMiddleware, securityValidation, validationMiddleware, SettingsController.updateSecuritySettings);
router.post('/verify-pin', sanitizationMiddleware, SettingsController.verifyTransactionPin);

module.exports = router;
