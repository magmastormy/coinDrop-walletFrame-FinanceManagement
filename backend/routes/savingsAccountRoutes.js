const express = require('express');
const router = express.Router();
const SavingsAccountController = require('../controllers/savingsAccountController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all savings accounts for a user
router.get('/', SavingsAccountController.getUserSavingsAccounts);

// Create a new savings account
router.post('/', SavingsAccountController.createSavingsAccount);

// Update a savings account
router.put('/:id', SavingsAccountController.updateSavingsAccount);

// Delete a savings account
router.delete('/:id', SavingsAccountController.deleteSavingsAccount);

// Update a transaction in a savings account
router.put('/transactions/:id', SavingsAccountController.updateTransaction);

module.exports = router;