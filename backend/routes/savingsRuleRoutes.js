// backend/routes/savingsRuleRoutes.js
const express = require('express');
const router = express.Router();
const SavingsRuleController = require('../controllers/savingsRuleController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Test route without middleware or controller
router.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Get all rules for a user
router.get('/user/:userId', authMiddleware, (req, res) => {
  SavingsRuleController.getUserRules(req, res);
});

// Create a new rule
router.post('/', authMiddleware, (req, res) => {
  SavingsRuleController.createRule(req, res);
});

// Update a rule
router.put('/:ruleId', authMiddleware, (req, res) => {
  SavingsRuleController.updateRule(req, res);
});

// Delete a rule
router.delete('/:ruleId', authMiddleware, (req, res) => {
  SavingsRuleController.deleteRule(req, res);
});

// Execute rules for a transaction
router.post('/execute', authMiddleware, (req, res) => {
  SavingsRuleController.executeRules(req, res);
});

// Get rule statistics
router.get('/stats/:userId', authMiddleware, (req, res) => {
  SavingsRuleController.getRuleStats(req, res);
});

module.exports = router;