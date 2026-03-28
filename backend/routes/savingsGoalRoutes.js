const express = require('express');
const router = express.Router();
const SavingsGoalController = require('../controllers/savingsGoalController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all savings goals for a user
router.get('/', SavingsGoalController.getUserSavingsGoals);

// Create a new savings goal
router.post('/', SavingsGoalController.createSavingsGoal);

// Update a savings goal
router.put('/:id', SavingsGoalController.updateSavingsGoal);

// Delete a savings goal
router.delete('/:id', SavingsGoalController.deleteSavingsGoal);

// Contribute to a savings goal
router.post('/:goalId/contribute', SavingsGoalController.contributeSavingsGoal);

// Generate savings recommendations
router.post('/recommendations', SavingsGoalController.generateRecommendations);

module.exports = router;
