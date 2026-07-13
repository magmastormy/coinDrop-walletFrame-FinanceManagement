const express = require('express');
const router = express.Router();
const SavingsAccountController = require('../controllers/savingsAccountController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { body, param } = require('express-validator');

// Validation rules for creating/updating savings account
const savingsAccountValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Account name must be between 2 and 50 characters'),
    body('type')
        .isIn(['emergency', 'goal', 'retirement', 'education', 'vacation', 'custom'])
        .withMessage('Invalid account type'),
    body('targetAmount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Target amount must be a non-negative number'),
    body('currentBalance')
        .optional()
        .isFloat({ min: 0 }).withMessage('Current balance must be a non-negative number'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code'),
    body('description')
        .optional()
        .isString()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// Validation for deposit/withdraw
const transactionValidation = [
    body('amount')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('description')
        .optional()
        .isString()
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

// Validation for transfer between accounts
const transferValidation = [
    body('fromAccountId')
        .notEmpty().withMessage('Source account ID is required')
        .isMongoId().withMessage('Invalid source account ID'),
    body('toAccountId')
        .notEmpty().withMessage('Destination account ID is required')
        .isMongoId().withMessage('Invalid destination account ID'),
    body('amount')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('description')
        .optional()
        .isString()
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
];

router.use(authMiddleware);
router.use(sanitizationMiddleware);

// Get all savings accounts for a user
router.get('/', SavingsAccountController.getUserSavingsAccounts);
router.get('/account/:id', sanitizationMiddleware, SavingsAccountController.getSavingsAccountById);

// Create a new savings account
router.post('/', 
    sanitizationMiddleware,
    savingsAccountValidation, 
    validationMiddleware,
    SavingsAccountController.createSavingsAccount
);

// Update a transaction in a savings account
router.put('/transactions/:id', 
    sanitizationMiddleware,
    transactionValidation,
    validationMiddleware,
    SavingsAccountController.updateTransaction
);

// Update a savings account
router.put('/:id', 
    sanitizationMiddleware,
    savingsAccountValidation, 
    validationMiddleware,
    SavingsAccountController.updateSavingsAccount
);

// Delete a savings account
router.delete('/:id', sanitizationMiddleware, SavingsAccountController.deleteSavingsAccount);

// Add deposit/withdraw routes
router.post('/:accountId/deposit', 
    sanitizationMiddleware,
    transactionValidation,
    validationMiddleware,
    SavingsAccountController.depositToSavings
);
router.post('/:accountId/withdraw', 
    sanitizationMiddleware,
    transactionValidation,
    validationMiddleware,
    SavingsAccountController.withdrawFromSavings
);

// Add transfer between accounts route
router.post('/transfer-between-accounts', 
    sanitizationMiddleware,
    transferValidation,
    validationMiddleware,
    SavingsAccountController.transferBetweenAccounts
);

module.exports = router;
