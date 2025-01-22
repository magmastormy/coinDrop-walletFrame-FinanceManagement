const express = require('express');
const router = express.Router();
const SavingsGoalController = require('../controllers/savingsGoalController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all savings goals for a user
router.get('/:userId', SavingsGoalController.getUserSavingsGoals);

// Create a new savings goal
router.post('/', SavingsGoalController.createSavingsGoal);

// Update a savings goal
router.put('/:id', SavingsGoalController.updateSavingsGoal);

// Delete a savings goal
router.delete('/:id', SavingsGoalController.deleteSavingsGoal);

module.exports = router;