const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { 
    createTransactionValidation, 
    updateTransactionValidation, 
    transactionQueryValidation 
} = require('../middleware/transactionValidation');
const { transactionRateLimit, antiFraudMiddleware } = require('../middleware/rateLimitingMiddleware');
const { fieldFilters } = require('../middleware/fieldFilterMiddleware');

// Protect all transaction routes
router.use(authMiddleware);
router.use(transactionRateLimit);
router.use(antiFraudMiddleware);

// Transaction Routes
router.post('/', sanitizationMiddleware, fieldFilters.transactionCreate, createTransactionValidation, validationMiddleware, TransactionController.createTransaction);
router.get('/', sanitizationMiddleware, fieldFilters.transactionQuery, transactionQueryValidation, validationMiddleware, TransactionController.getUserTransactions);
// Support both PATCH and PUT for transaction updates
router.patch('/:id', sanitizationMiddleware, fieldFilters.transactionUpdate, updateTransactionValidation, validationMiddleware, TransactionController.updateTransaction);
router.put('/:id', sanitizationMiddleware, fieldFilters.transactionUpdate, updateTransactionValidation, validationMiddleware, TransactionController.updateTransaction); // Added PUT route
router.delete('/:id', sanitizationMiddleware, TransactionController.deleteTransaction);
router.get('/stats', sanitizationMiddleware, fieldFilters.transactionQuery, TransactionController.getTransactionStats);
router.get('/budget/:budgetId', sanitizationMiddleware, TransactionController.getTransactionsByBudget);
router.get('/status/:jobId', sanitizationMiddleware, TransactionController.getTransactionStatus);
router.get('/uncategorized', sanitizationMiddleware, TransactionController.getUncategorizedTransactions);
router.patch('/bulk-update', sanitizationMiddleware, fieldFilters.transactionUpdate, TransactionController.bulkUpdateTransactions);
router.post('/bulk-delete', sanitizationMiddleware, TransactionController.bulkDeleteTransactions);

module.exports = router;
