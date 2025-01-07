const express = require('express');
const router = express.Router();
const SavingsGoalController = require('../controllers/savingsGoalController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all savings goals for a user
router.get('/', SavingsGoalController.getUserSavingsGoals);

// Create a new savings goal
router.post('/', SavingsGoalController.createSavingsGoal);

// Update a savings goal
router.put('/:id', SavingsGoalController.updateSavingsGoal);

// Delete a savings goal
router.delete('/:id', SavingsGoalController.deleteSavingsGoal);

module.exports = router;