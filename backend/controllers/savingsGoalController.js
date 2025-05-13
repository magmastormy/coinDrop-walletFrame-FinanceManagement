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
        let session = null;
        let targetDestinationId = null;
        let destinationType = null;

        try {
            // Start a MongoDB session for transaction
            session = await mongoose.startSession();
            session.startTransaction();

            // Get parameters from request
            const { id } = req.params;
            const { transferToSavingsAccountId, transferToWalletId } = req.body || {};
            const userId = req.user._id || req.user.id || req.query.userId;
            
            // Validate MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.error(`[SavingsGoalController - deleteSavingsGoal] Invalid ObjectId format: ${id}`);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({ error: 'Invalid savings goal ID format' });
            }

            console.log(`[SavingsGoalController - deleteSavingsGoal] Deleting goal ${id} with transfer to savings account ${transferToSavingsAccountId || 'none'} or wallet ${transferToWalletId || 'none'}`);

            // Find the savings goal to delete
            const savingsGoal = await SavingsGoal.findOne({
                _id: id,
                userId
            }).session(session);

            // Check if savings goal exists
            if (!savingsGoal) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(404).json({ error: 'Savings goal not found' });
            }

            const remainingAmount = savingsGoal.currentAmount || 0;

            console.log(`[SavingsGoalController - deleteSavingsGoal] Found goal with amount: ${remainingAmount}`);

            // If goal has money, transfer it
            if (remainingAmount > 0) {
                try {
                    // Find or create a category for goal closure
                    let goalClosureCategory = await Category.findOne({
                        userId,
                        name: "Goal Closure"
                    }).session(session);

                    if (!goalClosureCategory) {
                        // Find any category to use as fallback
                        const anyCategory = await Category.findOne({
                            userId
                        }).session(session);

                        if (anyCategory) {
                            goalClosureCategory = anyCategory;
                        } else {
                            // If no categories exist, create a Goal Closure category
                            const newCategory = new Category({
                                userId,
                                name: "Goal Closure",
                                description: "Funds from closed savings goals"
                            });
                            goalClosureCategory = await newCategory.save({ session });
                        }
                    }

                    // Determine where to transfer the money
                    if (transferToSavingsAccountId) {
                        // Transfer to specified savings account
                        const savingsAccount = await SavingsAccount.findOne({
                            _id: transferToSavingsAccountId,
                            userId
                        }).session(session);

                        if (!savingsAccount) {
                            if (session) {
                                await session.abortTransaction();
                                session.endSession();
                            }
                            return res.status(404).json({
                                error: 'Target savings account not found',
                                details: 'The savings account to transfer funds to does not exist or does not belong to you'
                            });
                        }

                        console.log(`[SavingsGoalController - deleteSavingsGoal] Transferring ${remainingAmount} to savings account ${savingsAccount._id}`);

                        // Update savings account balance
                        savingsAccount.balance = (savingsAccount.balance || 0) + remainingAmount;
                        await savingsAccount.save({ session });

                        // Record the transaction
                        const transaction = new Transaction({
                            userId,
                            amount: remainingAmount,
                            type: 'transfer',
                            category: goalClosureCategory._id,
                            description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                            savingsAccountId: savingsAccount._id,
                            date: new Date(),
                        });

                        await transaction.save({ session });

                        // Store destination info for response
                        targetDestinationId = savingsAccount._id;
                        destinationType = 'savings_account';

                    } else {
                        // No savings account specified, try to find one or use a wallet
                        const savingsAccounts = await SavingsAccount.find({ userId }).session(session);

                        if (savingsAccounts && savingsAccounts.length > 0) {
                            // Transfer to the first savings account
                            const targetAccount = savingsAccounts[0];

                            console.log(`[SavingsGoalController - deleteSavingsGoal] No target account specified, transferring ${remainingAmount} to savings account ${targetAccount._id}`);

                            // Update savings account balance
                            targetAccount.balance = (targetAccount.balance || 0) + remainingAmount;
                            await targetAccount.save({ session });

                            // Record the transaction
                            const transaction = new Transaction({
                                userId,
                                amount: remainingAmount,
                                type: 'transfer',
                                category: goalClosureCategory._id,
                                description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                                savingsAccountId: targetAccount._id,
                                date: new Date(),
                            });

                            await transaction.save({ session });

                            // Store destination info for response
                            targetDestinationId = targetAccount._id;
                            destinationType = 'savings_account';

                        } else {
                            // No savings accounts found, transfer to wallet
                            let targetWallet = null;

                            if (transferToWalletId) {
                                // Use specified wallet
                                targetWallet = await Wallet.findOne({
                                    _id: transferToWalletId,
                                    userId,
                                    isActive: true
                                }).session(session);

                                if (!targetWallet) {
                                    if (session) {
                                        await session.abortTransaction();
                                        session.endSession();
                                    }
                                    return res.status(404).json({
                                        error: 'Target wallet not found',
                                        details: 'The wallet to transfer funds to does not exist or does not belong to you'
                                    });
                                }
                            } else {
                                // Find any active wallet
                                targetWallet = await Wallet.findOne({
                                    userId,
                                    isActive: true
                                }).session(session);

                                if (!targetWallet) {
                                    try {
                                        // No wallet found, create a system wallet
                                        const systemWalletUtil = require('../utils/systemWalletUtil');
                                        targetWallet = await systemWalletUtil.findOrCreateTargetWallet(
                                            userId,
                                            null, // No wallet to exclude
                                            remainingAmount,
                                            session
                                        );
                                    } catch (walletError) {
                                        console.error('[SavingsGoalController - deleteSavingsGoal] Error creating system wallet:', walletError);
                                        if (session) {
                                            await session.abortTransaction();
                                            session.endSession();
                                        }
                                        return res.status(500).json({
                                            error: 'Failed to create system wallet',
                                            details: walletError.message
                                        });
                                    }
                                }
                            }

                            // Ensure target wallet exists
                            if (!targetWallet) {
                                if (session) {
                                    await session.abortTransaction();
                                    session.endSession();
                                }
                                return res.status(500).json({
                                    error: 'No valid wallet found',
                                    details: 'Could not find or create a wallet to transfer funds to'
                                });
                            }

                            console.log(`[SavingsGoalController - deleteSavingsGoal] Transferring ${remainingAmount} to wallet ${targetWallet._id}`);

                            // Update wallet balance
                            targetWallet.balance = (targetWallet.balance || 0) + remainingAmount;
                            await targetWallet.save({ session });

                            // Record the transaction
                            const transaction = new Transaction({
                                userId,
                                amount: remainingAmount,
                                type: 'transfer',
                                category: goalClosureCategory._id,
                                description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                                walletId: targetWallet._id,
                                date: new Date(),
                            });

                            await transaction.save({ session });

                            // Store destination info for response
                            targetDestinationId = targetWallet._id;
                            destinationType = 'wallet';
                        }
                    }
                } catch (transferError) {
                    console.error('[SavingsGoalController - deleteSavingsGoal] Error transferring funds:', transferError);
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Failed to transfer funds from savings goal',
                        details: transferError.message
                    });
                }
            }

            // Mark the savings goal as deleted instead of completely removing it
            try {
                await SavingsGoal.updateOne(
                    { _id: id },
                    {
                        $set: {
                            isActive: false,
                            currentAmount: 0,
                            deletedAt: new Date(),
                            status: 'deleted'
                        }
                    }
                ).session(session);

                console.log(`[SavingsGoalController - deleteSavingsGoal] Savings goal ${id} marked as deleted`);
            } catch (updateError) {
                console.error('[SavingsGoalController - deleteSavingsGoal] Error updating savings goal:', updateError);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(500).json({
                    error: 'Failed to mark savings goal as deleted',
                    details: updateError.message
                });
            }

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            session = null;

            // Send success response
            return res.json({
                message: 'Savings goal deleted successfully',
                transferredAmount: remainingAmount,
                transferredTo: targetDestinationId,
                destinationType: destinationType
            });
        } catch (error) {
            console.error('[SavingsGoalController - deleteSavingsGoal] Error:', error);

            // Ensure transaction is aborted and session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    session.endSession();
                } catch (sessionError) {
                    console.error('[SavingsGoalController - deleteSavingsGoal] Error ending session:', sessionError);
                }
            }

            return res.status(500).json({
                error: 'Failed to delete savings goal',
                details: error.message
            });
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