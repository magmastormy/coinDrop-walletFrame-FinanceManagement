const express = require('express');
const router = express.Router();
const SavingsGoalController = require('../controllers/savingsGoalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { body, param, query } = require('express-validator');
const { fieldFilters } = require('../middleware/fieldFilterMiddleware');

// Validation rules
const createSavingsGoalValidation = [
    body('name').notEmpty().withMessage('Name is required').isString().trim().isLength({ max: 100 }),
    body('targetAmount').notEmpty().withMessage('Target amount is required').isFloat({ min: 0.01 }),
    body('currentAmount').optional().isFloat({ min: 0 }),
    body('targetDate').optional().isISO8601(),
    body('category').optional().isString().trim().isLength({ max: 50 }),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
    body('icon').optional().isString().trim().isLength({ max: 50 })
];

const updateSavingsGoalValidation = [
    param('id').isMongoId().withMessage('Invalid savings goal ID'),
    body('name').optional().isString().trim().isLength({ max: 100 }),
    body('targetAmount').optional().isFloat({ min: 0.01 }),
    body('currentAmount').optional().isFloat({ min: 0 }),
    body('targetDate').optional().isISO8601(),
    body('category').optional().isString().trim().isLength({ max: 50 }),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
    body('icon').optional().isString().trim().isLength({ max: 50 })
];

const contributeValidation = [
    param('goalId').isMongoId().withMessage('Invalid savings goal ID'),
    body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }),
    body('walletId').optional().isMongoId().withMessage('Invalid wallet ID'),
    body('date').optional().isISO8601()
];

const queryValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc'])
];

router.use(authMiddleware);
router.use(sanitizationMiddleware);

// Get all savings goals for a user
router.get('/', fieldFilters.savingsGoalQuery, queryValidation, validationMiddleware, SavingsGoalController.getUserSavingsGoals);

// Create a new savings goal
router.post('/', fieldFilters.savingsGoalCreate, createSavingsGoalValidation, validationMiddleware, SavingsGoalController.createSavingsGoal);

// Update a savings goal
router.put('/:id', fieldFilters.savingsGoalUpdate, updateSavingsGoalValidation, validationMiddleware, SavingsGoalController.updateSavingsGoal);

// Delete a savings goal
router.delete('/:id', sanitizationMiddleware, SavingsGoalController.deleteSavingsGoal);

// Contribute to a savings goal
router.post('/:goalId/contribute', fieldFilters.savingsGoalUpdate, contributeValidation, validationMiddleware, SavingsGoalController.contributeSavingsGoal);

// Generate savings recommendations
router.post('/recommendations', sanitizationMiddleware, SavingsGoalController.generateRecommendations);

module.exports = router;
