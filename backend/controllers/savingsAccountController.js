const SavingsAccount = require('../models/SavingsAccount');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

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
            // Only return active (not deleted) accounts
            const accounts = await SavingsAccount.find({ userId: userId, isActive: true });
            res.json(accounts);
        } catch (error) {
            console.log("[SavingsAccountController - getUserSavingsAccounts] Error:", error);
            res.status(500).json({ error: '[SavingsAccountController - getUserSavingsAccounts] Failed to get user\'s savings accounts', details: error.message });
        }
    }

    static async deleteSavingsAccount(req, res) {
        let session = null;
        let targetWalletId = null;
        let operationId = new ObjectId().toString(); // Unique ID for tracking this operation
        
        try {
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Starting deletion process`);
            
            // Start a MongoDB session for transaction
            session = await mongoose.startSession();
            session.startTransaction();
            
            // Get parameters from request
            const { id } = req.params;
            const { transferToWalletId, userId: bodyUserId } = req.body || {};
            
            // Extract user ID from all possible sources (auth token, query params, request body)
            const userId = req.user?.userId || req.user?._id || req.user?.id || req.query?.userId || bodyUserId;
            
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] User ID sources:`, {
                fromToken: req.user?.userId || req.user?._id || req.user?.id || 'none',
                fromQuery: req.query?.userId || 'none',
                fromBody: bodyUserId || 'none',
                selected: userId || 'none'
            });
            
            if (!userId) {
                throw new Error('User ID is required - not found in request, query, or body');
            }
            
            // Convert IDs to ObjectId format if they're not already
            const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
            
            // Validate MongoDB ObjectId for account ID
            if (!ObjectId.isValid(id)) {
                console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Invalid ObjectId format for account: ${id}`);
                throw new Error('Invalid savings account ID format');
            }
            
            // If transferToWalletId is provided, validate it as well
            if (transferToWalletId && !ObjectId.isValid(transferToWalletId)) {
                console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Invalid wallet ObjectId format: ${transferToWalletId}`);
                throw new Error('Invalid wallet ID format');
            }
            
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Deleting account ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            
            // Check if account is already deleted
            const existingAccount = await SavingsAccount.findOne({ 
                _id: id,
                isActive: false
            }).session(session);
            
            if (existingAccount) {
                console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Account ${id} is already deleted`);
                throw new Error('Account is already deleted');
            }
            
            // Find the savings account to delete with a lock to prevent concurrent modifications
            const savingsAccount = await SavingsAccount.findOne({ 
                _id: id, 
                userId: userObjectId,
                isActive: true
            }).session(session);
            
            // Check if savings account exists
            if (!savingsAccount) {
                console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Savings account not found: ${id}`);
                throw new Error('Savings account not found');
            }
            
            const remainingBalance = parseFloat(savingsAccount.balance || 0).toFixed(2);
            const accountName = savingsAccount.name;
            
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Found account with balance: ${remainingBalance}`);
            
            // If account has balance, transfer it
            if (remainingBalance > 0) {
                // Find or create a category for account closure
                let accountClosureCategory = await Category.findOne({
                    userId: userObjectId,
                    name: "Account Closure"
                }).session(session);

                if (!accountClosureCategory) {
                    // Find any category to use as fallback
                    const anyCategory = await Category.findOne({
                        userId: userObjectId
                    }).session(session);
                    
                    if (anyCategory) {
                        accountClosureCategory = anyCategory;
                    } else {
                        // If no categories exist, create an Account Closure category
                        const newCategory = new Category({
                            userId: userObjectId,
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
                        userId: userObjectId,
                        isActive: true
                    }).session(session);
                    
                    if (!targetWallet) {
                        console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Target wallet not found: ${transferToWalletId}`);
                        throw new Error('Target wallet not found or does not belong to you');
                    }
                    
                    console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Wallet found, current balance: ${targetWallet.balance}`);
                } else {
                    // No wallet specified, find or create a system wallet
                    try {
                        const systemWalletUtil = require('../utils/systemWalletUtil');
                        targetWallet = await systemWalletUtil.findOrCreateTargetWallet(
                            userObjectId, 
                            null, // No wallet to exclude
                            remainingBalance,
                            session
                        );
                    } catch (walletError) {
                        console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Error creating system wallet:`, walletError);
                        throw new Error(`Failed to create system wallet: ${walletError.message}`);
                    }
                }
                
                // Ensure target wallet exists
                if (!targetWallet) {
                    console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] No valid wallet found`);
                    throw new Error('Could not find or create a wallet to transfer funds to');
                }
                
                // Store the target wallet ID for the response
                targetWalletId = targetWallet._id;
                
                // Update target wallet balance
                const oldWalletBalance = targetWallet.balance;
                targetWallet.balance = parseFloat(targetWallet.balance || 0) + parseFloat(remainingBalance);
                await targetWallet.save({ session });
                
                console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Wallet balance updated from ${oldWalletBalance} to ${targetWallet.balance}`);
                
                // Record the transaction
                const transaction = new Transaction({
                    userId: userObjectId,
                    amount: parseFloat(remainingBalance),
                    type: 'transfer',
                    category: accountClosureCategory._id,
                    description: `Transferred from deleted savings account: ${accountName}`,
                    savingsAccountId: id,
                    walletId: targetWallet._id,
                    date: new Date(),
                });
                
                await transaction.save({ session });
                
                console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction recorded for ${remainingBalance}`);
            }
            
            // Mark the savings account as deleted instead of completely removing it
            const updateResult = await SavingsAccount.updateOne(
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
            
            if (updateResult.modifiedCount !== 1) {
                console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Failed to update account status, modified count: ${updateResult.modifiedCount}`);
                throw new Error('Failed to mark savings account as deleted');
            }
            
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Savings account ${id} marked as deleted`);
            
            // Commit the transaction
            await session.commitTransaction();
            console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction committed successfully`);
            
            // Send success response
            return res.json({
                message: 'Savings account deleted successfully',
                accountId: id,
                accountName: accountName,
                transferredAmount: parseFloat(remainingBalance),
                transferredTo: targetWalletId,
                operationId: operationId
            });
        } catch (error) {
            console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Error:`, error);
            
            // Ensure transaction is aborted and session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction aborted`);
                } catch (sessionError) {
                    console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Error aborting transaction:`, sessionError);
                }
            }
            
            // Determine appropriate status code based on error type
            let statusCode = 500;
            if (error.message.includes('not found') || error.message.includes('already deleted')) {
                statusCode = 404;
            } else if (error.message.includes('Invalid') || error.message.includes('required')) {
                statusCode = 400;
            }
            
            return res.status(statusCode).json({ 
                error: 'Failed to delete savings account', 
                details: error.message,
                operationId: operationId
            });
        } finally {
            // Always end the session if it exists
            if (session) {
                session.endSession();
                console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Session ended`);
            }
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