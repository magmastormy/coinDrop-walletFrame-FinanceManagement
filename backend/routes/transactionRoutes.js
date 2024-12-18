const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all transaction routes
router.use(authMiddleware);

// Transaction Routes
router.post('/', TransactionController.createTransaction);
router.get('/', TransactionController.getUserTransactions);
router.patch('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);
router.get('/stats', TransactionController.getTransactionStats);

module.exports = router;
