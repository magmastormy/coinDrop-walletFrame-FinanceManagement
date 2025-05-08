const SavingsGoal = require('../models/SavingsGoal');
const SavingsAccount = require('../models/SavingsAccount');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');


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
            console.error('[SavingsGoalController] Error creating savings goal:', error);
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

    static async contributeSavingsGoal(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { goalId } = req.params;
            const { amount, sourceType, sourceId } = req.body;
            const userId = req.user._id || req.query.userId || req.user.userId;

            console.log("[savingsGoalController - contributeSavingsGoal] - sourceType: ", sourceType);
            console.log("[savingsGoalController - contributeSavingsGoal] - sourceId: ", sourceId);
            
            
            if (!goalId || !amount || (!sourceId)) {
                throw new Error('Missing required fields: goalId, amount, or source information');
            }

            // Find the savings goal
            const savingsGoal = await SavingsGoal.findOne({
                _id: goalId,
                userId: userId
            }).session(session);

            if (!savingsGoal) {
                throw new Error('Savings goal not found');
            }

            // Find the source (wallet or savings account)
            let source;
            if (sourceType == "wallet") {
                console.log("[savingsGoalController - contributeSavingsGoal] source: ", sourceType);
                source = await Wallet.findOne({
                    _id: sourceId,
                    userId: userId,
                    isActive: true
                }).session(session);
            } else {
                console.log("[savingsGoalController - contributeSavingsGoal] source is Savings");
                source = await SavingsAccount.findOne({
                    _id: sourceId,
                    userId: userId
                }).session(session);
            }

            if (!source) {
                throw new Error('Source not found');
            }

            // Check if source has sufficient balance
            if (source.balance < amount) {
                throw new Error('Insufficient balance in source');
            }

            // Find default category or create one if needed
            const defaultCategory = await Category.findOne({
                userId: userId,
                name: "Savings"
            }).session(session);

            let categoryId;
            if (defaultCategory) {
                categoryId = defaultCategory._id;
            } else {
                // Find any category to use as fallback
                const anyCategory = await Category.findOne({
                    userId: userId
                }).session(session);
                
                if (anyCategory) {
                    categoryId = anyCategory._id;
                } else {
                    // If no categories exist, create a Savings category
                    const newCategory = new Category({
                        userId: userId,
                        name: "Savings",
                        description: "Savings contributions"
                    });
                    const savedCategory = await newCategory.save({ session });
                    categoryId = savedCategory._id;
                }
            }

            // Update source balance
            source.balance -= parseFloat(amount);
            await source.save({ session });

            // Update savings goal current amount
            savingsGoal.currentAmount += parseFloat(amount);
            await savingsGoal.save({ session });

            // Create transaction record
            const transaction = new Transaction({
                userId: userId,
                type: 'expense',
                amount: parseFloat(amount),
                category: categoryId,
                description: `Contribution to ${savingsGoal.name} savings goal`,
                date: new Date(),
                walletId: source._id,
                savingsGoalId: goalId
            });

            await transaction.save({ session });

            await session.commitTransaction();

            res.json({
                message: 'Contribution successful',
                savingsGoal,
                transaction
            });
        } catch (error) {
            await session.abortTransaction();
            console.error('Contribution error:', error);
            res.status(400).json({
                error: 'Contribution failed',
                details: error.message
            });
        } finally {
            session.endSession();
        }
    }
}

module.exports = SavingsGoalController;