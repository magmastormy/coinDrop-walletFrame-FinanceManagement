const logger = require('../utils/logger');

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { getAuthenticatedUserId } = require('../utils/authUser');
const cacheUtil = require('../utils/cacheUtil');
const isDev = process.env.NODE_ENV !== 'production';

// Helper function to conditionally apply session to a query
const withSession = (query, session) => session ? query.session(session) : query;

// Helper function to conditionally save with session
const saveWithSession = (doc, session) => session ? doc.save({ session }) : doc.save();

/**
 * Wallet Controller
 * Handles wallet-related operations including creation, retrieval, updating, and deletion
 */
class WalletController {
    /**
     * Create a new wallet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async createWallet(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const walletData = {
                ...req.body,
                userId
            };

            const wallet = new Wallet(walletData);
            await wallet.save();

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[walletController] Invalidated cache for user ${userId}`);

            res.status(201).json({
                message: 'Wallet created successfully',
                wallet
            });
        } catch (error) {
            res.status(400).json({
                error: 'Wallet creation failed',
                details: error.message
            });
        }
    }

    /**
     * Get all wallets for a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getUserWallets(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            const wallets = await Wallet.find({ 
                userId, 
                isActive: true 
            }).sort({ balance: -1 });

            res.json({
                wallets,
                totalWallets: wallets.length,
                totalBalance: wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve wallets',
                details: error.message
            });
        }
    }

    /**
     * Update a wallet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async updateWallet(req, res) {
        try {
            const { id } = req.params;
            const userId = getAuthenticatedUserId(req);

            // Ensure wallet belongs to the user
            const wallet = await Wallet.findOneAndUpdate(
                { 
                    _id: id, 
                    userId
                },
                req.body,
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (!wallet) {
                return res.status(404).json({ 
                    error: 'Wallet not found or unauthorized' 
                });
            }

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[walletController] Invalidated cache for user ${userId}`);

            res.json({
                message: 'Wallet updated successfully',
                wallet
            });
        } catch (error) {
            res.status(400).json({
                error: 'Wallet update failed',
                details: error.message
            });
        }
    }

    /**
     * Delete a wallet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async deleteWallet(req, res) {
        let session = null;
        let useTransaction = false;
        
        try {
            // Try to start a MongoDB session for transaction
            try {
                session = await mongoose.startSession();
                session.startTransaction();
                useTransaction = true;
            } catch (sessionError) {
                // If transactions are not supported (e.g., non-replica set), continue without transaction
                if (isDev) logger.debug('[WalletController - deleteWallet] Transactions not supported, proceeding without transaction');
                useTransaction = false;
                session = null;
            }
            
            // Get parameters from request
            const { id } = req.params;
            const { transferToWalletId } = req.body || {};
            const userId = getAuthenticatedUserId(req);
            
            if (isDev) logger.debug(`[WalletController - deleteWallet] Deleting wallet ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            
            // Find the wallet to delete
            const wallet = await withSession(Wallet.findOne({ _id: id, userId }), session);
            
            // Check if wallet exists
            if (!wallet) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(404).json({ 
                    error: 'Wallet not found or unauthorized' 
                });
            }
            
            // Prevent deletion of system wallets with balance
            if (wallet.isSystemWallet && wallet.balance > 0) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({ 
                    error: 'Cannot delete system wallet with balance', 
                    details: 'This is a protected wallet that holds funds from deleted accounts. Transfer all funds out before deleting.'
                });
            }
            
            // Get remaining balance and initialize targetWalletId
            const remainingBalance = wallet.balance || 0;
            let targetWalletId = null;
            
            // If wallet has balance, transfer it to another wallet
            if (remainingBalance > 0) {
                if (isDev) logger.debug(`[WalletController - deleteWallet] Wallet has balance: ${remainingBalance}`);
                
                let targetWallet = null;
                
                // If a specific target wallet was provided
                if (transferToWalletId) {
                    targetWallet = await withSession(Wallet.findOne({ _id: transferToWalletId, userId }), session);
                    
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
                    // Find another wallet or create a system wallet
                    try {
                        const systemWalletUtil = require('../utils/systemWalletUtil');
                        targetWallet = await systemWalletUtil.findOrCreateTargetWallet(
                            userId, 
                            id, // Exclude the wallet being deleted
                            remainingBalance,
                            session
                        );
                    } catch (utilError) {
                        logger.error('[WalletController - deleteWallet] Error finding target wallet:', utilError);
                        if (session) {
                            await session.abortTransaction();
                            session.endSession();
                        }
                        return res.status(500).json({
                            error: 'Failed to find or create target wallet',
                            details: utilError.message
                        });
                    }
                }
                
                // Ensure targetWallet exists
                if (!targetWallet) {
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Target wallet not available',
                        details: 'Could not find or create a wallet to transfer funds to'
                    });
                }
                
                // Store the target wallet ID for the response
                targetWalletId = targetWallet._id;
                
                // Update target wallet balance
                targetWallet.balance += remainingBalance;
                await saveWithSession(targetWallet, session);
                
                if (isDev) logger.debug(`[WalletController - deleteWallet] Transferred ${remainingBalance} to wallet ${targetWallet._id}`);
                
                // Find or create a category for account closures
                let accountClosureCategory = null;
                try {
                    accountClosureCategory = await withSession(Category.findOne({
                        userId,
                        name: "Account Closure"
                    }), session);

                    if (!accountClosureCategory) {
                        // Find any category to use as fallback
                        const anyCategory = await withSession(Category.findOne({ userId }), session);
                        
                        if (anyCategory) {
                            accountClosureCategory = anyCategory;
                        } else {
                            // If no categories exist, create an Account Closure category
                            const newCategory = new Category({
                                userId,
                                name: "Account Closure",
                                description: "Funds from closed accounts"
                            });
                            accountClosureCategory = await saveWithSession(newCategory, session);
                        }
                    }
                } catch (categoryError) {
                    logger.error('[WalletController - deleteWallet] Error with category:', categoryError);
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Failed to process category',
                        details: categoryError.message
                    });
                }
                
                // Ensure category exists
                if (!accountClosureCategory) {
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Category not available',
                        details: 'Could not find or create a category for the transaction'
                    });
                }

                // Record the transaction
                try {
                    const transaction = new Transaction({
                        userId,
                        amount: remainingBalance,
                        type: 'transfer',
                        category: accountClosureCategory._id,
                        description: `Transferred from deleted wallet: ${wallet.name}`,
                        walletId: targetWallet._id,
                        fromWalletId: id,
                        date: new Date(),
                    });
                    
                    await saveWithSession(transaction, session);
                } catch (transactionError) {
                    logger.error('[WalletController - deleteWallet] Error creating transaction:', transactionError);
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Failed to create transaction record',
                        details: transactionError.message
                    });
                }
            }
            
            // Soft delete the wallet by marking it as inactive
            wallet.isActive = false;
            wallet.deletedAt = new Date();
            await saveWithSession(wallet, session);
            
            if (isDev) logger.debug(`[WalletController - deleteWallet] Wallet ${id} marked as deleted`);
            
            // Commit transaction if we're using one
            if (session) {
                await session.commitTransaction();
                session.endSession();
            }
            
            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[walletController] Invalidated cache for user ${userId}`);
            
            res.json({
                message: 'Wallet deleted successfully',
                deletedWalletId: id,
                transferredAmount: remainingBalance,
                transferredToWalletId: targetWalletId
            });
            
        } catch (error) {
            logger.error('[WalletController - deleteWallet] Error:', error);
            
            // Abort transaction if we're using one
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            
            res.status(500).json({
                error: 'Wallet deletion failed',
                details: error.message
            });
        }
    }

    /**
     * Transfer balance between wallets
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async transferBalance(req, res) {
        let session = null;
        let useTransaction = false;
        
        try {
            // Try to start a MongoDB session for transaction
            try {
                session = await mongoose.startSession();
                session.startTransaction();
                useTransaction = true;
            } catch (sessionError) {
                if (isDev) logger.debug('[WalletController - transferBalance] Transactions not supported, proceeding without transaction');
                useTransaction = false;
                session = null;
            }
            
            const { fromWalletId, toWalletId, amount } = req.body;
            const userId = getAuthenticatedUserId(req);
            
            if (!fromWalletId || !toWalletId || !amount) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({
                    error: 'Missing required fields',
                    details: 'fromWalletId, toWalletId, and amount are required'
                });
            }
            
            const transferAmount = parseFloat(amount);
            if (isNaN(transferAmount) || transferAmount <= 0) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({
                    error: 'Invalid amount',
                    details: 'Amount must be a positive number'
                });
            }
            
            // Find source wallet
            const sourceWallet = await withSession(Wallet.findOne({ 
                _id: fromWalletId, 
                userId 
            }), session);
            
            if (!sourceWallet) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(404).json({
                    error: 'Source wallet not found'
                });
            }
            
            if (sourceWallet.balance < transferAmount) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({
                    error: 'Insufficient funds',
                    details: `Available balance: ${sourceWallet.balance}`
                });
            }
            
            // Find destination wallet
            const destWallet = await withSession(Wallet.findOne({ 
                _id: toWalletId, 
                userId 
            }), session);
            
            if (!destWallet) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(404).json({
                    error: 'Destination wallet not found'
                });
            }
            
            // Update balances
            sourceWallet.balance -= transferAmount;
            destWallet.balance += transferAmount;
            
            await saveWithSession(sourceWallet, session);
            await saveWithSession(destWallet, session);
            
            // Commit transaction if we're using one
            if (session) {
                await session.commitTransaction();
                session.endSession();
            }
            
            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[walletController] Invalidated cache for user ${userId}`);
            
            res.json({
                message: 'Transfer successful',
                fromWallet: {
                    id: sourceWallet._id,
                    name: sourceWallet.name,
                    newBalance: sourceWallet.balance
                },
                toWallet: {
                    id: destWallet._id,
                    name: destWallet.name,
                    newBalance: destWallet.balance
                },
                amount: transferAmount
            });
            
        } catch (error) {
            logger.error('[WalletController - transferBalance] Error:', error);
            
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            
            res.status(500).json({
                error: 'Transfer failed',
                details: error.message
            });
        }
    }

    /**
     * Get wallet statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getWalletStats(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            const stats = await Wallet.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalWallets: { $sum: 1 },
                        totalBalance: { $sum: '$balance' },
                        avgBalance: { $avg: '$balance' },
                        maxBalance: { $max: '$balance' },
                        minBalance: { $min: '$balance' }
                    }
                }
            ]);
            
            // Get wallet type distribution
            const typeDistribution = await Wallet.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalBalance: { $sum: '$balance' }
                    }
                }
            ]);
            
            res.json({
                summary: stats[0] || {
                    totalWallets: 0,
                    totalBalance: 0,
                    avgBalance: 0,
                    maxBalance: 0,
                    minBalance: 0
                },
                typeDistribution
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve wallet statistics',
                details: error.message
            });
        }
    }

    /**
     * Get budgets associated with a wallet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getWalletBudgets(req, res) {
        try {
            const { id } = req.params;
            const userId = getAuthenticatedUserId(req);
            
            // Verify wallet belongs to user
            const wallet = await Wallet.findOne({ _id: id, userId });
            if (!wallet) {
                return res.status(404).json({
                    error: 'Wallet not found or unauthorized'
                });
            }
            
            // Find budgets that use this wallet
            const budgets = await Budget.find({
                userId,
                $or: [
                    { walletId: id },
                    { sourceWalletId: id }
                ]
            }).populate('category', 'name');
            
            res.json({
                walletId: id,
                walletName: wallet.name,
                budgets
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve wallet budgets',
                details: error.message
            });
        }
    }
}

module.exports = WalletController;
