const SavingsGoal = require('../models/SavingsGoal');

class SavingsGoalController {
    static async getUserSavingsGoals(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const goals = await SavingsGoal.find({ userId: userId });
            res.json(goals);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch savings goals' });
        }
    }

    static async createSavingsGoal(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            const newGoal = new SavingsGoal({ ...req.body, userId: userId });
            await newGoal.save();
            res.status(201).json(newGoal);
        } catch (error) {
            res.status(400).json({ error: 'Failed to create savings goal' });
        }
    }

    static async updateSavingsGoal(req, res) {
        try {
            const goal = await SavingsGoal.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(goal);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update savings goal' });
        }
    }

    static async deleteSavingsGoal(req, res) {
        try {
            await SavingsGoal.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: 'Failed to delete savings goal' });
        }
    }
}

module.exports = SavingsGoalController;