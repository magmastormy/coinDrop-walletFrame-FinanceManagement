const SavingsAccount = require('../models/SavingsAccount');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class SavingsAccountController {
    static async createSavingsAccount(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const { name, initialBalance, automation } = req.body;

            if (initialBalance === undefined || isNaN(initialBalance)) {
                return res.status(400).json({ error: 'Initial balance is required and must be a number.' });
            }
            console.log("SavingsAccountController - createSavingsAccount - redf.body: ", req.body);

            const savingsAccount = new SavingsAccount({
                userId: userId,
                name,
                balance: initialBalance,
                automation
            });
            await savingsAccount.save();
            res.status(201).json(savingsAccount);
        } catch (error) {
            res.status(400).json({ error: '[SavingsAccountController - createSavingsAccount] Failed to create savings account', details: error.message });
        }
    }

    static async transferToSavings(req, res) {
        try {
            const { amount, walletId } = req.body;
            const userId = req.user._id || req.query.userId || req.user.userId;

            const wallet = await Wallet.findOne({ _id: walletId, userId: userId});
            const savingsAccount = await SavingsAccount.findOne({ userId: userId });

            if (!wallet || wallet.balance < amount) {
                return res.status(400).json({ error: 'Insufficient funds in wallet' });
            }

            wallet.balance -= amount;
            savingsAccount.balance += amount;

            await wallet.save();
            await savingsAccount.save();

            res.json({ message: 'Transfer successful', savingsAccount });
        } catch (error) {
            res.status(500).json({ error: 'Transfer failed', details: error.message });
        }
    }

    static async getUserSavingsAccounts(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const accounts = await SavingsAccount.find({ userId: userId });
            res.json(accounts);
        } catch (error) {
            console.log("[SavingsAccountController - getUserSavingsAccounts] Error:", error);
            res.status(500).json({ error: '[SavingsAccountController - getUserSavingsAccounts] Failed to get user\'s savings accounts', details: error.message });
        }
    }

    static async deleteSavingsAccount(req, res) {
        let session = null;
        let targetWalletId = null;
        
        try {
            // Start a MongoDB session for transaction
            session = await mongoose.startSession();
            session.startTransaction();
            
            // Get parameters from request
            const { id } = req.params;
            const { transferToWalletId } = req.body || {};
            const userId = req.user._id || req.user.id || req.query.userId;
            
            // Validate MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.error(`[SavingsAccountController - deleteSavingsAccount] Invalid ObjectId format: ${id}`);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({ error: 'Invalid savings account ID format' });
            }
            
            // If transferToWalletId is provided, validate it as well
            if (transferToWalletId && !mongoose.Types.ObjectId.isValid(transferToWalletId)) {
                console.error(`[SavingsAccountController - deleteSavingsAccount] Invalid wallet ObjectId format: ${transferToWalletId}`);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({ error: 'Invalid wallet ID format' });
            }
            
            console.log(`[SavingsAccountController - deleteSavingsAccount] Deleting account ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            
            // Find the savings account to delete
            const savingsAccount = await SavingsAccount.findOne({ 
                _id: id, 
                userId 
            }).session(session);
            
            // Check if savings account exists
            if (!savingsAccount) {
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(404).json({ error: 'Savings account not found' });
            }
            
            const remainingBalance = savingsAccount.currentBalance || savingsAccount.balance || 0;
            
            console.log(`[SavingsAccountController - deleteSavingsAccount] Found account with balance: ${remainingBalance}`);
            
            // If account has balance, transfer it
            if (remainingBalance > 0) {
                try {
                    // Find or create a category for account closure
                    let accountClosureCategory = await Category.findOne({
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
                    
                    // Determine where to transfer the money
                    let targetWallet = null;
                    
                    if (transferToWalletId) {
                        // Transfer to specified wallet
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
                        
                        console.log(`[SavingsAccountController - deleteSavingsAccount] Wallet found, current balance: ${targetWallet.balance}`);
                    } else {
                        // No wallet specified, find or create a system wallet
                        try {
                            const systemWalletUtil = require('../utils/systemWalletUtil');
                            targetWallet = await systemWalletUtil.findOrCreateTargetWallet(
                                userId, 
                                null, // No wallet to exclude
                                remainingBalance,
                                session
                            );
                        } catch (walletError) {
                            console.error('[SavingsAccountController - deleteSavingsAccount] Error creating system wallet:', walletError);
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
                    
                    // Store the target wallet ID for the response
                    targetWalletId = targetWallet._id;
                    
                    // Update target wallet balance
                    targetWallet.balance = (targetWallet.balance || 0) + remainingBalance;
                    await targetWallet.save({ session });
                    
                    console.log(`[SavingsAccountController - deleteSavingsAccount] Wallet balance updated to: ${targetWallet.balance}`);
                    
                    // Record the transaction
                    try {
                        const transaction = new Transaction({
                            userId,
                            amount: remainingBalance,
                            type: 'transfer',
                            category: accountClosureCategory._id,
                            description: `Transferred from deleted savings account: ${savingsAccount.name}`,
                            savingsAccountId: id,
                            walletId: targetWallet._id,
                            date: new Date(),
                        });
                        
                        await transaction.save({ session });
                        
                        console.log(`[SavingsAccountController - deleteSavingsAccount] Transaction recorded for ${remainingBalance}`);
                    } catch (transactionError) {
                        console.error('[SavingsAccountController - deleteSavingsAccount] Error creating transaction:', transactionError);
                        if (session) {
                            await session.abortTransaction();
                            session.endSession();
                        }
                        return res.status(500).json({
                            error: 'Failed to create transaction record',
                            details: transactionError.message
                        });
                    }
                } catch (transferError) {
                    console.error('[SavingsAccountController - deleteSavingsAccount] Error transferring funds:', transferError);
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }
                    return res.status(500).json({
                        error: 'Failed to transfer funds from savings account',
                        details: transferError.message
                    });
                }
            }
            
            // Mark the savings account as deleted instead of completely removing it
            try {
                await SavingsAccount.updateOne(
                    { _id: id },
                    { 
                        $set: { 
                            isActive: false,
                            balance: 0,
                            deletedAt: new Date(),
                            status: 'deleted'
                        } 
                    }
                ).session(session);
                
                console.log(`[SavingsAccountController - deleteSavingsAccount] Savings account ${id} marked as deleted`);
            } catch (updateError) {
                console.error('[SavingsAccountController - deleteSavingsAccount] Error updating savings account:', updateError);
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(500).json({
                    error: 'Failed to mark savings account as deleted',
                    details: updateError.message
                });
            }
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            session = null;
            
            // Send success response
            return res.json({
                message: 'Savings account deleted successfully',
                transferredAmount: remainingBalance,
                transferredTo: targetWalletId
            });
        } catch (error) {
            console.error('[SavingsAccountController - deleteSavingsAccount] Error:', error);
            
            // Ensure transaction is aborted and session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    session.endSession();
                } catch (sessionError) {
                    console.error('[SavingsAccountController - deleteSavingsAccount] Error ending session:', sessionError);
                }
            }
            
            return res.status(500).json({ 
                error: 'Failed to delete savings account', 
                details: error.message 
            });
        }
    }

    static async updateSavingsAccount(req, res) {
        try {
            const account = await SavingsAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(account);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update savings account' });
        }
    }

    static async updateTransaction(req, res) {
        try {
            const account = await SavingsAccount.findById(req.params.id);
            const transactionIndex = account.transactions.findIndex(t => t._id.toString() === req.body._id);
            if (transactionIndex > -1) {
                account.transactions[transactionIndex] = req.body;
                await account.save();
                res.json(account);
            } else {
                res.status(404).json({ error: 'Transaction not found' });
            }
        } catch (error) {
            res.status(400).json({ error: 'Failed to update transaction' });
        }
    }

    static async depositToSavings(req, res) {
        try {
            const { walletId, amount } = req.body;
            const accountId = req.params.accountId;
            
            const account = await SavingsAccount.findById(accountId);
            const wallet = await Wallet.findById(walletId);

            if (!wallet || wallet.balance < amount) {
                return res.status(400).json({ error: 'Insufficient funds in wallet' });
            }

            wallet.balance -= amount;
            account.balance += amount;

            await wallet.save();
            await account.save();

            res.json({ message: 'Deposit successful', account });
        } catch (error) {
            res.status(500).json({ error: 'Deposit failed', details: error.message });
        }
    }

    static async withdrawFromSavings(req, res) {
        try {
            const { walletId, amount } = req.body;
            const accountId = req.params.accountId;
            
            const account = await SavingsAccount.findById(accountId);
            const wallet = await Wallet.findById(walletId);

            if (!wallet || account.balance < amount) {
                return res.status(400).json({ error: 'Insufficient funds in account' });
            }

            wallet.balance += amount;
            account.balance -= amount;

            await wallet.save();
            await account.save();

            res.json({ message: 'Withdrawal successful', account });
        } catch (error) {
            res.status(500).json({ error: 'Withdrawal failed', details: error.message });
        }
    }

    static async transferBetweenAccounts(req, res) {
        try {
            const { fromAccountId, toAccountId, amount } = req.body;
            
            // Validate inputs
            if (!fromAccountId || !toAccountId || !amount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Implement the transfer logic similar to other transfer methods
            const fromAccount = await SavingsAccount.findById(fromAccountId);
            const toAccount = await SavingsAccount.findById(toAccountId);
            
            // Perform the transfer
            fromAccount.balance -= parseFloat(amount);
            toAccount.balance += parseFloat(amount);
            
            await fromAccount.save();
            await toAccount.save();
            
            res.json({ 
                message: 'Transfer successful', 
                fromAccount, 
                toAccount 
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Transfer failed', 
                details: error.message 
            });
        }
    }
}

module.exports = SavingsAccountController;