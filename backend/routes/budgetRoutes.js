const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const BudgetController = require('../controllers/budgetController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Budget Validation Middleware
const budgetCreationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Budget name must be between 2 and 50 characters'),
    body('type')
        .isIn(['monthly', 'yearly', 'custom'])
        .withMessage('Invalid budget type'),
    body('category')
        .trim()
        .notEmpty().withMessage('Budget category is required'),
    body('amount')
        .isFloat({ min: 0 }).withMessage('Budget amount must be a positive number'),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
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
    query('status')
        .optional()
        .isIn(['active', 'completed', 'exceeded', 'archived'])
        .withMessage('Invalid budget status'),
    query('category')
        .optional()
        .trim()
];

// Protect all budget routes
router.use(authMiddleware);

// Budget Routes
router.post('/', 
    budgetCreationValidation, 
    BudgetController.createBudget
);

router.get('/', 
    budgetQueryValidation, 
    BudgetController.getUserBudgets
);

router.put('/:id', 
    budgetCreationValidation, 
    BudgetController.updateBudget
);

router.delete('/:id', BudgetController.deleteBudget);

// Budget Analytics Routes
router.get('/stats', BudgetController.getBudgetStats);
router.get('/performance', BudgetController.analyzeBudgetPerformance);

module.exports = router;
