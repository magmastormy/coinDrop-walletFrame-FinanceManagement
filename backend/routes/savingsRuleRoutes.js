// backend/routes/savingsRuleRoutes.js
const express = require('express');
const router = express.Router();
const SavingsRuleController = require('../controllers/savingsRuleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validationMiddleware } = require('../middleware/validationMiddleware');

// Get all rules for a user
router.get('/user', authMiddleware, SavingsRuleController.getUserRules);

// Create a new rule
router.post(
  '/',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('triggerType')
      .isIn(['income','expense','scheduled','roundUp','budgetUnderflow'])
      .withMessage('Invalid trigger type'),
    body('savePercentage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Save percentage must be between 0 and 100'),
    body('saveBudgetUnderflow')
      .isBoolean()
      .withMessage('saveBudgetUnderflow must be boolean'),
    body('roundUpTransactions')
      .isBoolean()
      .withMessage('roundUpTransactions must be boolean'),
    body('savingsPriority')
      .isIn(['low','medium','high'])
      .withMessage('Invalid savings priority'),
  ],
  validationMiddleware,
  SavingsRuleController.createRule
);

// Update a rule
router.put(
  '/:ruleId',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('triggerType')
      .isIn(['income','expense','scheduled','roundUp','budgetUnderflow'])
      .withMessage('Invalid trigger type'),
    body('savePercentage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Save percentage must be between 0 and 100'),
    body('saveBudgetUnderflow')
      .isBoolean()
      .withMessage('saveBudgetUnderflow must be boolean'),
    body('roundUpTransactions')
      .isBoolean()
      .withMessage('roundUpTransactions must be boolean'),
    body('savingsPriority')
      .isIn(['low','medium','high'])
      .withMessage('Invalid savings priority'),
  ],
  validationMiddleware,
  SavingsRuleController.updateRule
);

// Delete a rule
router.delete('/:ruleId', authMiddleware, SavingsRuleController.deleteRule);

// Execute rules for a transaction
router.post('/execute', authMiddleware, SavingsRuleController.executeRules);

// Get rule statistics
router.get('/stats', authMiddleware, SavingsRuleController.getRuleStats);

module.exports = router;
