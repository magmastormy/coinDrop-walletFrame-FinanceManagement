/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { fieldFilters } = require('../middleware/fieldFilterMiddleware');

// RATE LIMITING - Stricter limits for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes (brute force protection)
    message: {
        status: 429,
        error: 'Too many authentication attempts',
        message: 'Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count all requests including failures
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 registrations per hour (increased for development/testing)
    message: {
        status: 429,
        error: 'Too many registration attempts',
        message: 'Please try again later or contact support if this is a legitimate request'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development environment
    skip: (req) => process.env.NODE_ENV === 'development'
});

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
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/)
        .withMessage('Password must include uppercase, lowercase, number, and special character (@$!%*?&_)'),
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
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/)
        .withMessage('New password must include uppercase, lowercase, number, and special character (@$!%*?&_)')
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
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens')
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/)
        .withMessage('Password must include uppercase, lowercase, number, and special character (@$!%*?&)'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];

// Apply sanitization middleware to all routes
router.use(sanitizationMiddleware);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: 
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: Username for the new user
 *               email: 
 *                 type: string
 *                 format: email
 *                 description: Email address for the new user
 *               password: 
 *                 type: string
 *                 minLength: 8
 *                 description: Password for the new user
 *               firstName: 
 *                 type: string
 *                 minLength: 2
 *                 description: First name of the user
 *               lastName: 
 *                 type: string
 *                 minLength: 2
 *                 description: Last name of the user
 *               phone: 
 *                 type: string
 *                 description: Optional phone number for the user
 *     responses:
 *       201: 
 *         description: User registered successfully
 *       400: 
 *         description: Invalid input data
 *       409: 
 *         description: User already exists
 */
router.post('/register', registerLimiter, registerValidation, validationMiddleware, AuthController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: 
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               password: 
 *                 type: string
 *                 description: Password of the user
 *     responses:
 *       200: 
 *         description: User logged in successfully
 *       400: 
 *         description: Invalid input data
 *       401: 
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginValidation, validationMiddleware, AuthController.login);
/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: 
 *                 type: string
 *                 description: Refresh token for the user
 *     responses:
 *       200: 
 *         description: Token refreshed successfully
 *       400: 
 *         description: Invalid input data
 *       401: 
 *         description: Invalid refresh token
 */
router.post('/refresh-token', refreshTokenValidation, validationMiddleware, AuthController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: User logged out successfully
 *       401: 
 *         description: Unauthorized
 */
router.post('/logout', authMiddleware, AuthController.logout);
/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout the current user from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: User logged out from all devices successfully
 *       401: 
 *         description: Unauthorized
 */
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: User profile retrieved successfully
 *       401: 
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, AuthController.getProfile);
/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: 
 *                 type: string
 *                 minLength: 2
 *                 description: First name of the user
 *               lastName: 
 *                 type: string
 *                 minLength: 2
 *                 description: Last name of the user
 *               phone: 
 *                 type: string
 *                 description: Phone number of the user
 *               profilePicture: 
 *                 type: string
 *                 format: url
 *                 description: URL of the user's profile picture
 *     responses:
 *       200: 
 *         description: User profile updated successfully
 *       400: 
 *         description: Invalid input data
 *       401: 
 *         description: Unauthorized
 */
router.put('/profile', authMiddleware, profileUpdateValidation, AuthController.updateProfile);
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change the current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: 
 *                 type: string
 *                 description: Current password of the user
 *               newPassword: 
 *                 type: string
 *                 minLength: 8
 *                 description: New password for the user
 *     responses:
 *       200: 
 *         description: Password changed successfully
 *       400: 
 *         description: Invalid input data
 *       401: 
 *         description: Unauthorized or invalid current password
 */
router.post('/change-password', authMiddleware, passwordChangeValidation, AuthController.changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: 
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               lastName: 
 *                 type: string
 *                 minLength: 2
 *                 description: Last name of the user
 *     responses:
 *       200: 
 *         description: Password reset request processed
 *       400: 
 *         description: Invalid input data
 *       404: 
 *         description: User not found
 */
router.post('/forgot-password', forgotPasswordValidation, validationMiddleware, AuthController.forgotPassword);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: 
 *                 type: string
 *                 description: Password reset token
 *               newPassword: 
 *                 type: string
 *                 minLength: 8
 *                 description: New password for the user
 *               confirmPassword: 
 *                 type: string
 *                 description: Confirmation of the new password
 *     responses:
 *       200: 
 *         description: Password reset successfully
 *       400: 
 *         description: Invalid input data
 *       401: 
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordValidation, validationMiddleware, AuthController.resetPassword);

module.exports = router;
