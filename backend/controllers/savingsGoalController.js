const SavingsGoal = require('../models/SavingsGoal');
const SavingsAccount = require('../models/SavingsAccount');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { getAuthenticatedUserId } = require('../utils/authUser');
const isDev = process.env.NODE_ENV !== 'production';


class SavingsGoalController {
    static async getUserSavingsGoals(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            // Only return active (not deleted) goals
            const goals = await SavingsGoal.find({ userId: userId, isActive: true });
            res.json(goals);
        } catch (error) {
            console.error('[SavingsGoalController - getUserSavingsGoals] Error:', error);
            res.status(500).json({ error: 'Failed to fetch savings goals', details: error.message });
        }
    }

    static async createSavingsGoal(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
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
            const userId = getAuthenticatedUserId(req);
            const goal = await SavingsGoal.findOneAndUpdate(
                { _id: req.params.id, userId, isActive: true },
                req.body,
                { new: true }
            );
            if (!goal) {
                return res.status(404).json({ error: 'Savings goal not found' });
            }
            res.json(goal);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update savings goal' });
        }
    }

    static async deleteSavingsGoal(req, res) {
        const operationId = req.body?.operationId || `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const MAX_RETRY_ATTEMPTS = 3;

        // Helper: Validate and normalize ObjectId
        const toObjectId = (id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);

        // Helper: Find or create a closure category
        async function getGoalClosureCategory(userId, session) {
            let cat = await Category.findOne({ userId, name: 'Goal Closure' }).session(session);
            if (cat) return cat;
            cat = await Category.findOne({ userId }).session(session);
            if (cat) return cat;
            return await new Category({ userId, name: 'Goal Closure', description: 'Funds from closed savings goals' }).save({ session });
        }

        // Helper: Transfer funds to a destination
        async function transferFunds({
            userId, session, savingsGoal, remainingAmount, transferToSavingsAccountId, transferToWalletId
        }) {
            const goalClosureCategory = await getGoalClosureCategory(userId, session);
            // Try savings account first
            if (transferToSavingsAccountId) {
                const savingsAccount = await SavingsAccount.findOne({ _id: transferToSavingsAccountId, userId, isActive: true }).session(session);
                if (!savingsAccount) throw new Error('Target savings account not found');
                savingsAccount.balance += remainingAmount;
                await savingsAccount.save({ session });
                await new Transaction({
                    userId,
                    amount: remainingAmount,
                    type: 'transfer',
                    category: goalClosureCategory._id,
                    description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                    savingsAccountId: savingsAccount._id,
                    date: new Date(),
                }).save({ session });
                return { destinationId: savingsAccount._id, destinationType: 'savings_account' };
            }
            // Try any savings account
            const savingsAccounts = await SavingsAccount.find({ userId, isActive: true }).session(session);
            if (savingsAccounts.length > 0) {
                const target = savingsAccounts[0];
                target.balance += remainingAmount;
                await target.save({ session });
                await new Transaction({
                    userId,
                    amount: remainingAmount,
                    type: 'transfer',
                    category: goalClosureCategory._id,
                    description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                    savingsAccountId: target._id,
                    date: new Date(),
                }).save({ session });
                return { destinationId: target._id, destinationType: 'savings_account' };
            }
            // Try wallet
            let wallet = null;
            if (transferToWalletId) {
                wallet = await Wallet.findOne({ _id: transferToWalletId, userId, isActive: true }).session(session);
                if (!wallet) throw new Error('Target wallet not found');
            } else {
                wallet = await Wallet.findOne({ userId, isActive: true }).session(session);
                if (!wallet) {
                    const systemWalletUtil = require('../utils/systemWalletUtil');
                    wallet = await systemWalletUtil.findOrCreateTargetWallet(userId, null, remainingAmount, session);
                }
            }
            if (!wallet) throw new Error('No valid wallet found');
            wallet.balance += remainingAmount;
            await wallet.save({ session });
            await new Transaction({
                userId,
                amount: remainingAmount,
                type: 'transfer',
                category: goalClosureCategory._id,
                description: `Transferred from deleted savings goal: ${savingsGoal.name}`,
                walletId: wallet._id,
                date: new Date(),
            }).save({ session });
            return { destinationId: wallet._id, destinationType: 'wallet' };
        }

        // Main transaction logic
        const attemptDelete = async () => {
            let session = null;
            try {
                session = await mongoose.startSession();
                session.startTransaction();
                const { id } = req.params;
                const { transferToSavingsAccountId, transferToWalletId } = req.body || {};
                const userId = getAuthenticatedUserId(req);
                if (!userId) throw new Error('User ID is required');
                if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid savings goal ID format');
                if (transferToWalletId && !mongoose.Types.ObjectId.isValid(transferToWalletId)) throw new Error('Invalid wallet ID format');
                if (transferToSavingsAccountId && !mongoose.Types.ObjectId.isValid(transferToSavingsAccountId)) throw new Error('Invalid savings account ID format');
                const userObjectId = toObjectId(userId);
                const savingsGoal = await SavingsGoal.findOne({ _id: id, userId: userObjectId, isActive: true }).session(session);
                if (!savingsGoal) throw new Error('Savings goal not found or already deleted');
                const remainingAmount = savingsGoal.currentAmount || 0;
                let destinationId = null, destinationType = null;
                if (remainingAmount > 0) {
                    ({ destinationId, destinationType } = await transferFunds({
                        userId: userObjectId,
                        session,
                        savingsGoal,
                        remainingAmount,
                        transferToSavingsAccountId,
                        transferToWalletId
                    }));
                }
                await SavingsGoal.updateOne(
                    { _id: id, userId: userObjectId, isActive: true },
                    { $set: { isActive: false, currentAmount: 0, deletedAt: new Date(), status: 'deleted' } }
                ).session(session);
                await session.commitTransaction();
                return res.json({
                    success: true,
                    message: 'Savings goal deleted successfully',
                    goalId: id,
                    transferredAmount: remainingAmount > 0 ? remainingAmount : 0,
                    destinationType,
                    destinationId,
                    operationId
                });
            } catch (error) {
                if (session) {
                    try { await session.abortTransaction(); session.endSession(); } catch {}
                }
                throw error;
            } finally {
                if (session) session.endSession();
            }
        };

        // Retry logic
        for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 100;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                return await attemptDelete();
            } catch (error) {
                const isTransientError = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
                if (!isTransientError || attempt === MAX_RETRY_ATTEMPTS) {
                    let statusCode = 500;
                    if (error.message.includes('not found') || error.message.includes('already deleted')) statusCode = 404;
                    else if (error.message.includes('Invalid') || error.message.includes('required')) statusCode = 400;
                    return res.status(statusCode).json({
                        success: false,
                        error: 'Failed to delete savings goal',
                        details: error.message,
                        operationId,
                        retryAttempts: attempt
                    });
                }
            }
        }
    }

    static async contributeSavingsGoal(req, res) {
        const operationId = req.body?.operationId || `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        // Maximum number of retry attempts for transaction
        const MAX_RETRY_ATTEMPTS = 3;
        
        // Function to execute the transaction with retry logic
        const executeTransaction = async () => {
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
            const { goalId } = req.params;
            const { amount, sourceType, sourceId } = req.body;
            const userId = getAuthenticatedUserId(req);
            const numericAmount = Number(amount);

            if (isDev) console.log("[savingsGoalController - contributeSavingsGoal] - sourceType: ", sourceType);
            if (isDev) console.log("[savingsGoalController - contributeSavingsGoal] - sourceId: ", sourceId);

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                throw new Error('Amount must be a positive number');
            }

            // Find the source (wallet or savings account)
            let source;
            if (sourceType == "wallet") {
                if (isDev) console.log("[savingsGoalController - contributeSavingsGoal] source: ", sourceType);
                source = await Wallet.findOne({
                    _id: sourceId,
                    userId: userId,
                    isActive: true
                }).session(session);
            } else {
                if (isDev) console.log("[savingsGoalController - contributeSavingsGoal] source is Savings");
                source = await SavingsAccount.findOne({
                    _id: sourceId,
                    userId: userId,
                    isActive: true
                }).session(session);
            }

            if (!source) {
                throw new Error('Source not found');
            }

            // Check if source has sufficient balance
            if (source.balance < numericAmount) {
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
            source.balance -= numericAmount;
            await source.save({ session });

            // Update savings goal current amount
            const savingsGoal = await SavingsGoal.findOne({ _id: goalId, userId, isActive: true }).session(session);
            if (!savingsGoal) {
                throw new Error('Savings goal not found');
            }
            savingsGoal.currentAmount += numericAmount;
            await savingsGoal.save({ session });

            // Create transaction record
            const transaction = new Transaction({
                userId: userId,
                type: 'expense',
                amount: numericAmount,
                category: categoryId,
                description: `Contribution to ${savingsGoal.name} savings goal`,
                date: new Date(),
                walletId: sourceType === "wallet" ? source._id : undefined,
                savingsGoalId: goalId
            });

            await transaction.save({ session });

                await session.commitTransaction();
                
                res.json({
                    success: true,
                    message: 'Contribution successful',
                    savingsGoal,
                    transaction,
                    operationId
                });
                return true; // Signal success to the retry mechanism
            } catch (error) {
                try {
                    await session.abortTransaction();
                } catch (abortError) {
                    console.error(`[SavingsGoalController - contributeSavingsGoal][${operationId}] Error aborting transaction: ${abortError.message}`);
                }
                throw error; // Rethrow for retry mechanism
            } finally {
                session.endSession();
            }
        };
        
        // Execute transaction with retry logic
        try {
            for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
                try {
                    if (attempt > 0) {
                        if (isDev) console.log(`[SavingsGoalController - contributeSavingsGoal][${operationId}] Retry attempt ${attempt} of ${MAX_RETRY_ATTEMPTS}`);
                        // Add exponential backoff delay between retries
                        const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                    const result = await executeTransaction();
                    if (result) return; // Transaction succeeded
                } catch (error) {
                    // Only retry if it's a transient transaction error
                    const isTransientError = 
                        error.errorLabels && 
                        error.errorLabels.includes('TransientTransactionError');
                    
                    if (isTransientError && attempt < MAX_RETRY_ATTEMPTS) {
                        if (isDev) console.log(`[SavingsGoalController - contributeSavingsGoal][${operationId}] Transaction failed with transient error, will retry:`, error.message);
                        continue; // Try again
                    }
                    
                    // If we've exhausted retries or it's not a transient error, rethrow
                    throw error;
                }
            }
        } catch (error) {
            console.error(`[SavingsGoalController - contributeSavingsGoal][${operationId}] ${error.message}`);
            res.status(400).json({
                success: false,
                error: 'Contribution failed',
                details: error.message,
                operationId
            });
        }
    }
}

module.exports = SavingsGoalController;

