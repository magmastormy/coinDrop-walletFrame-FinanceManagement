const SavingsGoal = require('../models/SavingsGoal');
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
            
            // For backward compatibility
            const sourceWalletId = req.body.sourceWalletId || (sourceType === 'wallet' ? sourceId : null);
            
            if (!goalId || !amount || (!sourceWalletId && !sourceId)) {
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

            // Find the source wallet
            const sourceWallet = await Wallet.findOne({
                _id: sourceWalletId || sourceId,
                userId: userId,
                isActive: true
            }).session(session);

            if (!sourceWallet) {
                throw new Error('Source wallet not found');
            }

            // Check if wallet has sufficient balance
            if (sourceWallet.balance < amount) {
                throw new Error('Insufficient balance in source wallet');
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

            // Update wallet balance
            sourceWallet.balance -= parseFloat(amount);
            await sourceWallet.save({ session });

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
                walletId: sourceWallet._id,
                savingsGoalId: goalId
            });

            await transaction.save({ session });

            // Create contribution record if SavingsContribution model exists
            let contribution = null;
            if (mongoose.models.SavingsContribution) {
                contribution = new mongoose.models.SavingsContribution({
                    userId: userId,
                    savingsGoalId: goalId,
                    amount: parseFloat(amount),
                    date: new Date(),
                    sourceWalletId: sourceWallet._id,
                    transactionId: transaction._id
                });
                await contribution.save({ session });
            }

            await session.commitTransaction();

            res.json({
                message: 'Contribution successful',
                savingsGoal,
                contribution,
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