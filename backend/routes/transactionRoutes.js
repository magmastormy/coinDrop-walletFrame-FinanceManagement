const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all transaction routes
router.use(authMiddleware);

// Transaction Routes
router.post('/', TransactionController.createTransaction);
router.get('/', TransactionController.getUserTransactions);
// Support both PATCH and PUT for transaction updates
router.patch('/:id', TransactionController.updateTransaction);
router.put('/:id', TransactionController.updateTransaction); // Added PUT route
router.delete('/:id', TransactionController.deleteTransaction);
router.get('/stats', TransactionController.getTransactionStats);
router.get('/budget/:budgetId', TransactionController.getTransactionsByBudget);

module.exports = router;
