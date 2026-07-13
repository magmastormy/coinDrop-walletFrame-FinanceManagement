const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const BudgetController = require('../controllers/budgetController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');

// Budget Validation Middleware
const budgetCreationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Budget name must be between 2 and 50 characters'),
    body('type')
        .isIn(['expense', 'income', 'savings'])
        .withMessage('Invalid budget type'),
    body('period')
        .isIn(['daily', 'weekly', 'monthly', 'yearly'])
        .withMessage('Invalid budget period'),
    body('category')
        .isMongoId().withMessage('Budget category is required'),
    body('walletId')
        .isMongoId().withMessage('Wallet is required'),
    body('amount')
        .isFloat({ min: 0 }).withMessage('Budget amount must be a positive number'),
    body('startDate')
        .notEmpty()
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code'),
    body('isRecurring')
        .optional()
        .isBoolean().withMessage('Recurring flag must be a boolean'),
    body('frequency')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
        .withMessage('Invalid budget frequency')
];

// Budget Query Validation
const budgetQueryValidation = [
    query('category')
        .optional()
        .isMongoId().withMessage('Invalid category id')
];

// Protect all budget routes
router.use(authMiddleware);
router.use(sanitizationMiddleware);

// Budget Routes
router.post('/', 
    budgetCreationValidation, 
    validationMiddleware,
    BudgetController.createBudget
);

router.get('/', 
    sanitizationMiddleware,
    budgetQueryValidation, 
    validationMiddleware,
    BudgetController.getUserBudgets
);

router.put('/:id', 
    sanitizationMiddleware,
    budgetCreationValidation, 
    validationMiddleware,
    BudgetController.updateBudget
);

router.delete('/:id', sanitizationMiddleware, BudgetController.deleteBudget);

// Budget Analytics Routes
router.get('/stats', sanitizationMiddleware, BudgetController.getBudgetStats);
router.get('/performance', sanitizationMiddleware, BudgetController.analyzeBudgetPerformance);

// Budget Automation Routes
router.post('/renew', sanitizationMiddleware, BudgetController.renewRecurringBudgets);
router.get('/alerts', sanitizationMiddleware, BudgetController.checkBudgetAlerts);

module.exports = router;
