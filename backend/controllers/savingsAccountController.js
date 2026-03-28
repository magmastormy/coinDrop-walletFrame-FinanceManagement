const SavingsAccount = require('../models/SavingsAccount');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { getAuthenticatedUserId } = require('../utils/authUser');
const isDev = process.env.NODE_ENV !== 'production';

class SavingsAccountController {
    static async createSavingsAccount(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);

            const { name, initialBalance, automation } = req.body;
            const normalizedName = typeof name === 'string' ? name.trim() : '';
            const numericInitialBalance = Number(initialBalance);

            if (!normalizedName) {
                return res.status(400).json({ error: 'Savings account name is required.' });
            }

            if (!Number.isFinite(numericInitialBalance) || numericInitialBalance < 0) {
                return res.status(400).json({ error: 'Initial balance must be a number greater than or equal to zero.' });
            }
            if (isDev) console.log('[SavingsAccountController - createSavingsAccount] Creating new savings account');

            const savingsAccount = new SavingsAccount({
                userId: userId,
                name: normalizedName,
                balance: numericInitialBalance,
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
            const userId = getAuthenticatedUserId(req);
            const numericAmount = Number(amount);

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }

            if (!ObjectId.isValid(walletId)) {
                return res.status(400).json({ error: 'Invalid wallet ID format' });
            }

            const wallet = await Wallet.findOne({ _id: walletId, userId: userId, isActive: true });
            const savingsAccount = await SavingsAccount.findOne({ userId: userId, isActive: true });

            if (!wallet) {
                return res.status(404).json({ error: 'Wallet not found' });
            }

            if (!savingsAccount) {
                return res.status(404).json({ error: 'Savings account not found' });
            }

            if (wallet.balance < numericAmount) {
                return res.status(400).json({ error: 'Insufficient funds in wallet' });
            }

            wallet.balance -= numericAmount;
            savingsAccount.balance += numericAmount;

            await wallet.save();
            await savingsAccount.save();

            res.json({ message: 'Transfer successful', savingsAccount });
        } catch (error) {
            res.status(500).json({ error: 'Transfer failed', details: error.message });
        }
    }

    static async getUserSavingsAccounts(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            // Only return active (not deleted) accounts
            const accounts = await SavingsAccount.find({ userId: userId, isActive: true });
            res.json(accounts);
        } catch (error) {
            if (isDev) console.error(`[SavingsAccountController - getUserSavingsAccounts] ${error.message}`);
            res.status(500).json({ error: 'Failed to get savings accounts' });
        }
    }

    static async getSavingsAccountById(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid savings account ID format' });
            }

            const account = await SavingsAccount.findOne({
                _id: id,
                userId,
                isActive: true
            });

            if (!account) {
                return res.status(404).json({ error: 'Savings account not found' });
            }

            return res.json(account);
        } catch (error) {
            return res.status(500).json({
                error: 'Failed to retrieve savings account'
            });
        }
    }

    static async deleteSavingsAccount(req, res) {
        let session = null;
        let targetWalletId = null;
        let operationId = new ObjectId().toString(); // Unique ID for tracking this operation
        
        try {
            if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Starting deletion process`);
            
            // Check if we can use transactions (requires replica set)
            const useTransaction = process.env.MONGODB_REPLICA_SET || false;
            
            // Start a MongoDB session for transaction
            if (useTransaction) {
                session = await mongoose.startSession();
                session.startTransaction();
            }
            
            // Get parameters from request
            const { id } = req.params;
            const { transferToWalletId } = req.body || {};
            const userId = getAuthenticatedUserId(req);
            
            if (!userId) {
                throw new Error('User ID is required');
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
            
            if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Deleting account ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            
            // Check if account is already deleted
            const existingAccount = await SavingsAccount.findOne({ 
                _id: id,
                userId: userObjectId,
                isActive: false
            }).session(session);
            
            if (existingAccount) {
                if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Account ${id} is already deleted`);
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
            
            const remainingBalance = parseFloat((Number(savingsAccount.balance || 0)).toFixed(2));
            const accountName = savingsAccount.name;
            
            if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Found account with balance: ${remainingBalance}`);
            
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
                    
                    if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Wallet found, current balance: ${targetWallet.balance}`);
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
                targetWallet.balance = parseFloat((Number(targetWallet.balance || 0) + remainingBalance).toFixed(2));
                await targetWallet.save({ session });
                
                if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Wallet balance updated from ${oldWalletBalance} to ${targetWallet.balance}`);
                
                // Record the transaction
                const transaction = new Transaction({
                    userId: userObjectId,
                    amount: remainingBalance,
                    type: 'transfer',
                    category: accountClosureCategory._id,
                    description: `Transferred from deleted savings account: ${accountName}`,
                    savingsAccountId: id,
                    walletId: targetWallet._id,
                    date: new Date(),
                });
                
                await transaction.save({ session });
                
                if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction recorded for ${remainingBalance}`);
            }
            
            // Mark the savings account as deleted instead of completely removing it
            const updateResult = await SavingsAccount.updateOne(
                { _id: id, userId: userObjectId, isActive: true },
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
            
            if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Savings account ${id} marked as deleted`);
            
            // Commit the transaction
            if (session) {
                await session.commitTransaction();
            }
            if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction committed successfully`);
            
            // Send success response
            return res.json({
                message: 'Savings account deleted successfully',
                accountId: id,
                accountName: accountName,
                transferredAmount: remainingBalance,
                transferredTo: targetWalletId,
                operationId: operationId
            });
        } catch (error) {
            console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] ${error.message}`);
            
            // Ensure transaction is aborted and session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Transaction aborted`);
                } catch (sessionError) {
                    console.error(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Error aborting transaction: ${sessionError.message}`);
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
                if (isDev) console.log(`[SavingsAccountController - deleteSavingsAccount][${operationId}] Session ended`);
            }
        }
    }

    static async updateSavingsAccount(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid savings account ID format' });
            }

            const updates = {};

            if (typeof req.body.name === 'string') {
                const trimmedName = req.body.name.trim();
                if (!trimmedName) {
                    return res.status(400).json({ error: 'Savings account name cannot be empty' });
                }
                updates.name = trimmedName;
            }

            if (Object.prototype.hasOwnProperty.call(req.body, 'automation')) {
                updates.automation = req.body.automation;
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid fields provided for update' });
            }

            const account = await SavingsAccount.findOneAndUpdate(
                { _id: id, userId, isActive: true },
                { $set: updates },
                { new: true, runValidators: true }
            );
            if (!account) {
                return res.status(404).json({ error: 'Savings account not found' });
            }
            res.json(account);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update savings account', details: error.message });
        }
    }

    static async updateTransaction(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const transactionId = req.params.id;
            const account = await SavingsAccount.findOne({
                userId,
                isActive: true,
                'transactions._id': transactionId
            });
            if (!account) {
                return res.status(404).json({ error: 'Savings transaction not found' });
            }

            const transaction = account.transactions.id(transactionId);
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            const allowedUpdates = ['amount', 'type', 'description', 'date', 'category', 'walletId'];
            allowedUpdates.forEach((field) => {
                if (field in req.body) {
                    transaction[field] = req.body[field];
                }
            });

            await account.save();
            res.json(account);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update transaction' });
        }
    }

    static async depositToSavings(req, res) {
        try {
            const { walletId, amount } = req.body;
            const accountId = req.params.accountId;
            const userId = getAuthenticatedUserId(req);
            const numericAmount = parseFloat(amount);

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }

            if (!ObjectId.isValid(accountId) || !ObjectId.isValid(walletId)) {
                return res.status(400).json({ error: 'Invalid account or wallet ID format' });
            }
            
            // Use atomic operations to prevent race conditions
            const walletUpdate = await Wallet.findOneAndUpdate(
                { 
                    _id: walletId, 
                    userId, 
                    isActive: true,
                    balance: { $gte: numericAmount }  // Atomic balance check
                },
                { 
                    $inc: { balance: -numericAmount }  // Atomic decrement
                },
                { 
                    runValidators: true 
                }
            );

            if (!walletUpdate) {
                return res.status(400).json({ error: 'Insufficient funds in wallet or wallet not found' });
            }

            const accountUpdate = await SavingsAccount.findOneAndUpdate(
                { 
                    _id: accountId, 
                    userId, 
                    isActive: true 
                },
                { 
                    $inc: { balance: numericAmount }  // Atomic increment
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!accountUpdate) {
                // Rollback wallet
                await Wallet.findOneAndUpdate(
                    { _id: walletId, userId },
                    { $inc: { balance: numericAmount } }
                );
                return res.status(404).json({ error: 'Savings account not found' });
            }

            res.json({ message: 'Deposit successful', account: accountUpdate });
        } catch (error) {
            res.status(500).json({ error: 'Deposit failed', details: error.message });
        }
    }

    static async withdrawFromSavings(req, res) {
        try {
            const { walletId, amount } = req.body;
            const accountId = req.params.accountId;
            const userId = getAuthenticatedUserId(req);
            const numericAmount = parseFloat(amount);

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }

            if (!ObjectId.isValid(accountId) || !ObjectId.isValid(walletId)) {
                return res.status(400).json({ error: 'Invalid account or wallet ID format' });
            }
            
            // Use atomic operations to prevent race conditions
            const accountUpdate = await SavingsAccount.findOneAndUpdate(
                { 
                    _id: accountId, 
                    userId, 
                    isActive: true,
                    balance: { $gte: numericAmount }  // Atomic balance check
                },
                { 
                    $inc: { balance: -numericAmount }  // Atomic decrement
                },
                { 
                    runValidators: true 
                }
            );

            if (!accountUpdate) {
                return res.status(400).json({ error: 'Insufficient funds in account or account not found' });
            }

            const walletUpdate = await Wallet.findOneAndUpdate(
                { 
                    _id: walletId, 
                    userId, 
                    isActive: true 
                },
                { 
                    $inc: { balance: numericAmount }  // Atomic increment
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!walletUpdate) {
                // Rollback account
                await SavingsAccount.findOneAndUpdate(
                    { _id: accountId, userId },
                    { $inc: { balance: numericAmount } }
                );
                return res.status(404).json({ error: 'Wallet not found' });
            }

            res.json({ message: 'Withdrawal successful', account: accountUpdate });
        } catch (error) {
            res.status(500).json({ error: 'Withdrawal failed', details: error.message });
        }
    }

    static async transferBetweenAccounts(req, res) {
        try {
            const { fromAccountId, toAccountId, amount } = req.body;
            const userId = getAuthenticatedUserId(req);
            const numericAmount = parseFloat(amount);
            
            // Validate inputs
            if (!fromAccountId || !toAccountId || amount === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number' });
            }

            if (!ObjectId.isValid(fromAccountId) || !ObjectId.isValid(toAccountId)) {
                return res.status(400).json({ error: 'Invalid account ID format' });
            }

            if (String(fromAccountId) === String(toAccountId)) {
                return res.status(400).json({ error: 'Source and destination accounts must be different' });
            }
            
            // Use atomic operations to prevent race conditions
            const fromAccountUpdate = await SavingsAccount.findOneAndUpdate(
                { 
                    _id: fromAccountId, 
                    userId, 
                    isActive: true,
                    balance: { $gte: numericAmount }  // Atomic balance check
                },
                { 
                    $inc: { balance: -numericAmount }  // Atomic decrement
                },
                { 
                    runValidators: true 
                }
            );

            if (!fromAccountUpdate) {
                return res.status(400).json({ error: 'Insufficient funds in source account or account not found' });
            }

            const toAccountUpdate = await SavingsAccount.findOneAndUpdate(
                { 
                    _id: toAccountId, 
                    userId, 
                    isActive: true 
                },
                { 
                    $inc: { balance: numericAmount }  // Atomic increment
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!toAccountUpdate) {
                // Rollback source account
                await SavingsAccount.findOneAndUpdate(
                    { _id: fromAccountId, userId },
                    { $inc: { balance: numericAmount } }
                );
                return res.status(404).json({ error: 'Destination account not found' });
            }
            
            // Refresh documents for response
            const fromAccount = await SavingsAccount.findById(fromAccountId);
            const toAccount = toAccountUpdate;
            
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

