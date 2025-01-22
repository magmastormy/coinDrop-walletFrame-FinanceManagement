const express = require('express');
const router = express.Router();
const SavingsAccountController = require('../controllers/savingsAccountController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all savings accounts for a user
router.get('/:userId', SavingsAccountController.getUserSavingsAccounts);

// Create a new savings account
router.post('/', SavingsAccountController.createSavingsAccount);

// Update a savings account
router.put('/:id', SavingsAccountController.updateSavingsAccount);

// Delete a savings account
router.delete('/:id', SavingsAccountController.deleteSavingsAccount);

// Update a transaction in a savings account
router.put('/transactions/:id', SavingsAccountController.updateTransaction);

module.exports = router;