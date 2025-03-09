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
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const { id } = req.params;
            const { transferToWalletId } = req.body || {};
            const userId = req.user._id || req.user.id || req.query.userId;
            
            console.log(`[SavingsAccountController - deleteSavingsAccount] Deleting account ${id} with transfer to wallet ${transferToWalletId || 'none'}`);
            console.log(`[SavingsAccountController - deleteSavingsAccount] request data: ${req.body}`);
            
            const savingsAccount = await SavingsAccount.findOne({ 
                _id: id, 
                userId 
            }).session(session);
            
            if (!savingsAccount) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: 'Savings account not found' });
            }
            
            const remainingBalance = savingsAccount.currentBalance || savingsAccount.balance || 0;
            
            console.log(`[SavingsAccountController - deleteSavingsAccount] Found account with balance: ${remainingBalance}`);
            
            if (remainingBalance > 0 && transferToWalletId) {
                console.log(`[SavingsAccountController - deleteSavingsAccount] Account has balance: ${remainingBalance}, attempting transfer to wallet ${transferToWalletId}`);
                
                const wallet = await Wallet.findOne({ 
                    _id: transferToWalletId, 
                    userId 
                }).session(session);
                
                if (!wallet) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ 
                        error: 'Target wallet not found',
                        details: 'The wallet to transfer funds to does not exist or does not belong to you'
                    });
                }
                
                console.log(`[SavingsAccountController - deleteSavingsAccount] Wallet found, current balance: ${wallet.balance}`);
                
                wallet.balance += remainingBalance;
                await wallet.save({ session });
                
                console.log(`[SavingsAccountController - deleteSavingsAccount] Wallet balance updated to: ${wallet.balance}`);
                
                const transaction = new Transaction({
                    userId,
                    amount: remainingBalance,
                    type: 'transfer',
                    category: 'account_closure',
                    description: `Transferred from deleted savings account: ${savingsAccount.name}`,
                    savingsAccountId: id,
                    walletId: transferToWalletId,
                    date: new Date(),
                });
                
                await transaction.save({ session });
                
                console.log(`[SavingsAccountController - deleteSavingsAccount] Transaction recorded for ${remainingBalance}`);
            } else if (remainingBalance > 0) {
                console.log(`[SavingsAccountController - deleteSavingsAccount] Account has balance but no target wallet specified`);
            }
            
            // Delete the savings account
            await SavingsAccount.deleteOne({ _id: id }).session(session);
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            
            res.status(200).json({ 
                success: true, 
                message: 'Savings account deleted successfully',
                transferredAmount: transferToWalletId ? remainingBalance : 0,
                transferredTo: transferToWalletId || null
            });
            
        } catch (error) {
            // Abort transaction on error
            await session.abortTransaction();
            session.endSession();
            
            console.error('[SavingsAccountController - deleteSavingsAccount] Error:', error);
            res.status(500).json({ 
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