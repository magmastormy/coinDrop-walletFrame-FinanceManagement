const express = require('express');
const { authMiddleware, optionalTokenMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errorClasses');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { fieldFilters } = require('../middleware/fieldFilterMiddleware');

const router = express.Router();

// Password regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validation Middleware Functions
 */

/**
 * Validate user creation request body
 * @type {Array<Function>}
 */
const validateUserCreation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .trim()
        .escape(),
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(PASSWORD_REGEX)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .trim()
        .escape(),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .trim()
        .escape(),
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either "user" or "admin"')
];

/**
 * Validate user update request body
 * @type {Array<Function>}
 */
const validateUserUpdate = [
    body('username')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .trim()
        .escape(),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(PASSWORD_REGEX)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .optional()
        .trim()
        .escape(),
    body('lastName')
        .optional()
        .trim()
        .escape(),
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either "user" or "admin"'),
    body('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified must be a boolean value')
];

/**
 * Validate pagination query parameters
 * @type {Array<Function>}
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    query('sortBy')
        .optional()
        .trim()
        .escape(),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either "asc" or "desc"')
];

/**
 * Validate date range query parameters
 * @type {Array<Function>}
 */
const validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
        .custom((value, { req }) => {
            const startDate = req.query.startDate;
            if (startDate && value) {
                const start = new Date(startDate);
                const end = new Date(value);
                if (end <= start) {
                    throw new Error('End date must be after start date');
                }
            }
            return true;
        })
];

/**
 * Validate transaction query parameters
 * @type {Array<Function>}
 */
const validateTransactionQuery = [
    query('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Transaction type must be either "income" or "expense"'),
    query('userId')
        .optional()
        .isMongoId()
        .withMessage('Invalid user ID format'),
    query('categoryId')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID format'),
    ...validateDateRange,
    ...validatePagination
];

/**
 * Validate user ID parameter
 * @type {Array<Function>}
 */
const validateUserId = [
    param('id')
        .notEmpty()
        .withMessage('User ID is required')
        .isMongoId()
        .withMessage('Invalid user ID format')
];

/**
 * Validate transaction ID parameter
 * @type {Array<Function>}
 */
const validateTransactionId = [
    param('id')
        .notEmpty()
        .withMessage('Transaction ID is required')
        .isMongoId()
        .withMessage('Invalid transaction ID format')
];

/**
 * Handle validation errors middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {ValidationError} When validation fails
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));
        throw new ValidationError('Validation failed', formattedErrors);
    }
    next();
};

/**
 * Rate Limiters
 */

/**
 * Standard admin rate limiter - 100 requests per 15 minutes
 * Used for read operations
 */
const adminRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const error = new ValidationError(options.message);
        error.statusCode = 429;
        next(error);
    }
});

/**
 * Strict rate limiter - 30 requests per 15 minutes
 * Used for write operations (POST, PUT, DELETE)
 */
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: 'Too many write requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const error = new ValidationError(options.message);
        error.statusCode = 429;
        next(error);
    }
});

/**
 * Route Definitions
 * ============================================
 */

/**
 * Dashboard Routes
 * Routes for admin dashboard data and statistics
 */

/**
 * @route   GET /dashboard/overview
 * @desc    Get dashboard overview data
 * @access  Admin only
 */
router.get(
    '/dashboard/overview',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    adminController.getDashboardOverview
);

/**
 * @route   GET /dashboard/statistics
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get(
    '/dashboard/statistics',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    adminController.getDashboardStatistics
);

/**
 * User Management Routes
 * Routes for managing users in the system
 */

/**
 * @route   GET /users
 * @desc    List all users with pagination
 * @access  Admin only
 */
router.get(
    '/users',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    fieldFilters.adminUserQuery,
    validatePagination,
    handleValidationErrors,
    adminController.listUsers
);

/**
 * @route   GET /users/:id
 * @desc    Get detailed user information
 * @access  Admin only
 */
router.get(
    '/users/:id',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    validateUserId,
    handleValidationErrors,
    adminController.getUserDetails
);

/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post(
    '/users',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    fieldFilters.adminUserCreate,
    strictRateLimiter,
    validateUserCreation,
    handleValidationErrors,
    adminController.createUser
);

/**
 * @route   PUT /users/:id
 * @desc    Update user information
 * @access  Admin only
 */
router.put(
    '/users/:id',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    fieldFilters.adminUserUpdate,
    strictRateLimiter,
    validateUserId,
    validateUserUpdate,
    handleValidationErrors,
    adminController.updateUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete a user
 * @access  Admin only
 */
router.delete(
    '/users/:id',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    strictRateLimiter,
    validateUserId,
    handleValidationErrors,
    adminController.deleteUser
);

/**
 * Transaction Management Routes
 * Routes for managing and viewing transactions
 */

/**
 * @route   GET /transactions
 * @desc    List all transactions with filters
 * @access  Admin only
 */
router.get(
    '/transactions',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    fieldFilters.transactionQuery,
    adminRateLimiter,
    validateTransactionQuery,
    handleValidationErrors,
    adminController.listTransactions
);

/**
 * @route   GET /transactions/:id
 * @desc    Get detailed transaction information
 * @access  Admin only
 */
router.get(
    '/transactions/:id',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    validateTransactionId,
    handleValidationErrors,
    adminController.getTransactionDetails
);

/**
 * @route   GET /transactions/statistics
 * @desc    Get transaction statistics
 * @access  Admin only
 */
router.get(
    '/transactions/statistics',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    validateDateRange,
    handleValidationErrors,
    adminController.getTransactionStatistics
);

/**
 * System Routes
 * Routes for system health and metrics
 */

/**
 * @route   GET /system/health
 * @desc    Get system health status
 * @access  Admin only
 */
router.get(
    '/system/health',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    adminController.getSystemHealth
);

/**
 * @route   GET /system/metrics
 * @desc    Get system metrics
 * @access  Admin only
 */
router.get(
    '/system/metrics',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    adminController.getSystemMetrics
);

/**
 * Report Routes
 * Routes for generating reports
 */

/**
 * @route   GET /reports/summary
 * @desc    Get summary report
 * @access  Admin only
 */
router.get(
    '/reports/summary',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    validateDateRange,
    handleValidationErrors,
    adminController.getSummaryReport
);

/**
 * @route   GET /reports/detailed
 * @desc    Get detailed report
 * @access  Admin only
 */
router.get(
    '/reports/detailed',
    authMiddleware,
    isAdmin,
    sanitizationMiddleware,
    adminRateLimiter,
    validateDateRange,
    handleValidationErrors,
    adminController.getDetailedReport
);

module.exports = router;
