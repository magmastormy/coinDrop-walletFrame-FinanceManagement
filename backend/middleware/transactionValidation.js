const { body, param, query } = require('express-validator');

// Validation rules for creating a transaction
const createTransactionValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isNumeric().withMessage('Amount must be a number')
        .custom(value => {
            const num = parseFloat(value);
            if (num <= 0) {
                throw new Error('Amount must be a positive number');
            }
            return true;
        }),
    body('type')
        .notEmpty().withMessage('Transaction type is required')
        .isIn(['income', 'expense', 'transfer']).withMessage('Invalid transaction type'),
    body('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('walletId')
        .optional()
        .isMongoId().withMessage('Invalid wallet ID'),
    body('savingsAccountId')
        .optional()
        .isMongoId().withMessage('Invalid savings account ID'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

// Validation rules for updating a transaction
const updateTransactionValidation = [
    param('id')
        .isMongoId().withMessage('Invalid transaction ID'),
    body('amount')
        .optional()
        .isNumeric().withMessage('Amount must be a number')
        .custom(value => {
            const num = parseFloat(value);
            if (num <= 0) {
                throw new Error('Amount must be a positive number');
            }
            return true;
        }),
    body('type')
        .optional()
        .isIn(['income', 'expense', 'transfer']).withMessage('Invalid transaction type'),
    body('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('walletId')
        .optional()
        .isMongoId().withMessage('Invalid wallet ID'),
    body('savingsAccountId')
        .optional()
        .isMongoId().withMessage('Invalid savings account ID'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

// Validation rules for transaction queries
const transactionQueryValidation = [
    query('page')
        .optional()
        .isNumeric().withMessage('Page must be a number')
        .custom(value => {
            const num = parseInt(value);
            if (num <= 0) {
                throw new Error('Page must be a positive number');
            }
            return true;
        }),
    query('limit')
        .optional()
        .isNumeric().withMessage('Limit must be a number')
        .custom(value => {
            const num = parseInt(value);
            if (num <= 0 || num > 100) {
                throw new Error('Limit must be between 1 and 100');
            }
            return true;
        }),
    query('type')
        .optional()
        .isIn(['income', 'expense', 'transfer']).withMessage('Invalid transaction type'),
    query('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),
    query('walletId')
        .optional()
        .isMongoId().withMessage('Invalid wallet ID'),
    query('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    query('minAmount')
        .optional()
        .isNumeric().withMessage('Minimum amount must be a number'),
    query('maxAmount')
        .optional()
        .isNumeric().withMessage('Maximum amount must be a number')
];

module.exports = {
    createTransactionValidation,
    updateTransactionValidation,
    transactionQueryValidation
};