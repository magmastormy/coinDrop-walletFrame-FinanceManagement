const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Input Validation Middleware
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must include uppercase, lowercase, number, and special character'),
    body('firstName')
        .trim()
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('First name can only contain letters, spaces, and hyphens'),
    body('lastName')
        .trim()
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens'),
    body('phone')
        .optional()
        .matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number format')
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .not().isEmpty().withMessage('Password is required')
];

const profileUpdateValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('First name can only contain letters, spaces, and hyphens'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens'),
    body('phone')
        .optional()
        .matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number format'),
    body('profilePicture')
        .optional()
        .isURL().withMessage('Profile picture must be a valid URL')
];

const passwordChangeValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('New password must include uppercase, lowercase, number, and special character')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
];

const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required')
        .isJWT().withMessage('Invalid refresh token format')
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Valid email required'),
    body('lastName')
        .trim()
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must include uppercase, lowercase, number, and special character'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];

// Public Routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh-token', refreshTokenValidation, AuthController.refreshToken);

// Protected Routes (require authentication)
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, profileUpdateValidation, AuthController.updateProfile);
router.post('/change-password', authMiddleware, passwordChangeValidation, AuthController.changePassword);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, AuthController.forgotPassword);

module.exports = router;
