const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { getAuthenticatedUserId } = require('../utils/authUser');
const isDev = process.env.NODE_ENV !== 'production';

class WalletController {
    // Create a new wallet
    static async createWallet(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const walletData = {
                ...req.body,
                userId
            };

            const wallet = new Wallet(walletData);
            await wallet.save();

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

    // Get all wallets for a user
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

    // Update a wallet
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

    // Delete a wallet
    static async deleteWallet(req, res) {
        let session = null;
        
        try {
            // Start a MongoDB session for transaction
            session = await mongoose.startSession();
            session.startTransaction();
            
            // Get parameters from request
            const { id } = req.params;
            const { transferToWalletId } = req.body || {};
            const userId = getAuthenticatedUserId(req);
            
            if (isDev) console.log(`[WalletController - deleteWallet] Deleting wallet ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            
            // Find the wallet to delete
            const wallet = await Wallet.findOne({ 
                _id: id, 
                userId 
            }).session(session);
            
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
                if (isDev) console.log(`[WalletController - deleteWallet] Wallet has balance: ${remainingBalance}`);
                
                let targetWallet = null;
                
                // If a specific target wallet was provided
                if (transferToWalletId) {
                    targetWallet = await Wallet.findOne({ 
                        _id: transferToWalletId, 
                        userId 
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
                        console.error('[WalletController - deleteWallet] Error finding target wallet:', utilError);
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
                await targetWallet.save({ session });
                
                if (isDev) console.log(`[WalletController - deleteWallet] Transferred ${remainingBalance} to wallet ${targetWallet._id}`);
                
                // Find or create a category for account closures
                let accountClosureCategory = null;
                try {
                    accountClosureCategory = await Category.findOne({
                        userId,
                        name: "Account Closure"
                    }).session(session);

                    if (!accountClosureCategory) {
                        // Find any category to use as fallback
                        const anyCategory = await Category.findOne({
                            userId
                        }).session(session);
                        
                        if (anyCategory) {
                            accountClosureCategory = anyCategory;
                        } else {
                            // If no categories exist, create an Account Closure category
                            const newCategory = new Category({
                                userId,
                                name: "Account Closure",
                                description: "Funds from closed accounts"
                            });
                            accountClosureCategory = await newCategory.save({ session });
                        }
                    }
                } catch (categoryError) {
                    console.error('[WalletController - deleteWallet] Error with category:', categoryError);
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
                    
                    await transaction.save({ session });
                } catch (transactionError) {
                    console.error('[WalletController - deleteWallet] Error creating transaction:', transactionError);
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
            
            // Mark the wallet as inactive instead of deleting it
            try {
                await Wallet.updateOne(
                    { _id: id, userId },
                    { 
                        $set: { 
                            isActive: false,
                            balance: 0,
                            deletedAt: new Date()
                        } 
                    }
                ).session(session);
                
                if (isDev) console.log(`[WalletController - deleteWallet] Wallet ${id} marked as inactive`);
            } catch (updateError) {
                console.error('[WalletController - deleteWallet] Error updating wallet:', updateError);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(500).json({
                    error: 'Failed to mark wallet as inactive',
                    details: updateError.message
                });
            }
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            session = null;
            
            // Send success response
            return res.json({
                message: 'Wallet deleted successfully',
                transferredAmount: remainingBalance > 0 ? remainingBalance : 0,
                transferredTo: targetWalletId
            });
        } catch (error) {
            console.error('[WalletController - deleteWallet] Error:', error);
            
            // Ensure transaction is aborted and session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    session.endSession();
                } catch (sessionError) {
                    console.error('[WalletController - deleteWallet] Error ending session:', sessionError);
                }
            }
            
            return res.status(500).json({
                error: 'Wallet deletion failed',
                details: error.message
            });
        }

}

    // Get wallet statistics
    static async getWalletStats(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);

            const stats = await Wallet.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$type',
                        totalBalance: { $sum: '$balance' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.json({ stats });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve wallet statistics',
                details: error.message
            });
        }
    }

    // Transfer balance between wallets
    static async transferBalance(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { fromWalletId, toWalletId, amount } = req.body;
            const numAmount = parseFloat(amount);
            const userId = getAuthenticatedUserId(req);

            if (!fromWalletId || !toWalletId || !amount) {
                throw new Error('Missing required fields');
            }

            if (!Number.isFinite(numAmount) || numAmount <= 0) {
                throw new Error('Amount must be a positive number');
            }

            if (fromWalletId === toWalletId) {
                throw new Error('Source and destination wallets must be different');
            }

            // Validate wallets belong to user
            const fromWallet = await Wallet.findOne({ 
                _id: fromWalletId, 
                userId,
                isActive: true
            }).session(session);

            const toWallet = await Wallet.findOne({ 
                _id: toWalletId, 
                userId,
                isActive: true 
            }).session(session);

            if (!fromWallet || !toWallet) {
                await session.abortTransaction();
                return res.status(404).json({ 
                    error: 'One or both wallets not found' 
                });
            }

            // Check sufficient balance
            if (fromWallet.balance < numAmount) {
                await session.abortTransaction();
                return res.status(400).json({ 
                    error: 'Insufficient balance' 
                });
            }

            // Find default category or create one if needed
            const defaultCategory = await Category.findOne({
                userId,
                name: "Transfer"
            }).session(session);

            let categoryId;
            if (defaultCategory) {
                categoryId = defaultCategory._id;
            } else {
                // Find any category to use as fallback
                const anyCategory = await Category.findOne({
                    userId
                }).session(session);
                
                if (anyCategory) {
                    categoryId = anyCategory._id;
                } else {
                    // If no categories exist, create a Transfer category
                    const newCategory = new Category({
                        userId,
                        name: "Transfer",
                        description: "Transfers between wallets"
                    });
                    const savedCategory = await newCategory.save({ session });
                    categoryId = savedCategory._id;
                }
            }

            // Update wallet balances
            fromWallet.balance -= numAmount;
            toWallet.balance += numAmount;

            await Promise.all([
                fromWallet.save({ session }),
                toWallet.save({ session })
            ]);

            // Create transfer transaction
            const transferTransaction = new Transaction({
                userId,
                type: 'transfer',
                amount: numAmount,
                category: categoryId, 
                description: `Transfer from ${fromWallet.name} to ${toWallet.name}`,
                date: new Date(),
                walletId: fromWallet._id,
                fromWalletId: fromWallet._id,
                toWalletId: toWallet._id
            });

            await transferTransaction.save({ session });
            await session.commitTransaction();

            res.json({
                message: 'Transfer successfully',
                fromWallet,
                toWallet,
                transferTransaction
            });
        } catch (error) {
            await session.abortTransaction();
            if (isDev) console.log(`Transfer failed: ${error.message}`);

            res.status(400).json({
                error: 'Transfer failed',
                details: error.message
            });
        } finally {
            session.endSession();
        }
    }

    static async getWalletBudgets (req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const walletId = req.params.id || req.params.walletId;
            const budgets = await Budget.find({ 
                walletId,
                userId
            });
            
            res.json({ budgets });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = WalletController;

