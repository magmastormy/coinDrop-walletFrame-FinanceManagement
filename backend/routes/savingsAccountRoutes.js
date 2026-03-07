const express = require('express');
const router = express.Router();
const SavingsAccountController = require('../controllers/savingsAccountController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all savings accounts for a user
router.get('/', SavingsAccountController.getUserSavingsAccounts);
router.get('/account/:id', SavingsAccountController.getSavingsAccountById);

// Create a new savings account
router.post('/', SavingsAccountController.createSavingsAccount);

// Update a transaction in a savings account
router.put('/transactions/:id', SavingsAccountController.updateTransaction);

// Update a savings account
router.put('/:id', SavingsAccountController.updateSavingsAccount);

// Delete a savings account
router.delete('/:id', SavingsAccountController.deleteSavingsAccount);

// Add deposit/withdraw routes
router.post('/:accountId/deposit', SavingsAccountController.depositToSavings);
router.post('/:accountId/withdraw', SavingsAccountController.withdrawFromSavings);

// Add transfer between accounts route
router.post('/transfer-between-accounts', SavingsAccountController.transferBetweenAccounts);

module.exports = router;
