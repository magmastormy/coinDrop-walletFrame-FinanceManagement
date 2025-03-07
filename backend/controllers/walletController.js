const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const Category = require('../models/Category');

class WalletController {
    // Create a new wallet
    static async createWallet(req, res) {
        try {
            const walletData = {
                ...req.body,
                userId: req.user._id || req.query.userId || req.user.userId
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
            const userId = req.user._id || req.query.userId || req.user.userId;
            
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

            // Ensure wallet belongs to the user
            const wallet = await Wallet.findOneAndUpdate(
                { 
                    _id: id, 
                    userId: req.user._id || req.query.userId || req.user.userId
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
        try {
            const { id } = req.params;

            // Check if wallet has any transactions
            const transactionCount = await Transaction.countDocuments({ 
                walletId: id, 
                userId: req.user._id || req.query.userId || req.user.userId 
            });

            if (transactionCount > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete wallet with existing transactions' 
                });
            }

            const wallet = await Wallet.findOneAndDelete({
                _id: id,
                userId: req.user._id || req.query.userId || req.user.userId,
            });

            if (!wallet) {
                return res.status(404).json({ 
                    error: 'Wallet not found or unauthorized' 
                });
            }

            res.json({
                message: 'Wallet deleted successfully',
                wallet
            });
        } catch (error) {
            res.status(500).json({
                error: 'Wallet deletion failed',
                details: error.message
            });
        }
    }

    // Get wallet statistics
    static async getWalletStats(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

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

            if (!fromWalletId || !toWalletId || !amount) {
                throw new Error('Missing required fields');
            }

            // Validate wallets belong to user
            const fromWallet = await Wallet.findOne({ 
                _id: fromWalletId, 
                userId: req.user._id || req.query.userId || req.user.userId,
                isActive: true
            }).session(session);

            const toWallet = await Wallet.findOne({ 
                _id: toWalletId, 
                userId: req.user._id || req.query.userId || req.user.userId,
                isActive: true 
            }).session(session);

            if (!fromWallet || !toWallet) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ 
                    error: 'One or both wallets not found' 
                });
            }

            // Check sufficient balance
            if (fromWallet.balance < amount) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    error: 'Insufficient balance' 
                });
            }

            // Find default category or create one if needed
            const defaultCategory = await Category.findOne({
                userId: req.user._id || req.query.userId || req.user.userId,
                name: "Transfer"
            }).session(session);

            let categoryId;
            if (defaultCategory) {
                categoryId = defaultCategory._id;
            } else {
                // Find any category to use as fallback
                const anyCategory = await Category.findOne({
                    userId: req.user._id || req.query.userId || req.user.userId
                }).session(session);
                
                if (anyCategory) {
                    categoryId = anyCategory._id;
                } else {
                    // If no categories exist, create a Transfer category
                    const newCategory = new Category({
                        userId: req.user._id || req.query.userId || req.user.userId,
                        name: "Transfer",
                        description: "Transfers between wallets"
                    });
                    const savedCategory = await newCategory.save({ session });
                    categoryId = savedCategory._id;
                }
            }

            // Update wallet balances
            fromWallet.balance -= amount;
            toWallet.balance += amount;

            await Promise.all([
                fromWallet.save({ session }),
                toWallet.save({ session })
            ]);

            // Create transfer transaction
            const transferTransaction = new Transaction({
                userId: req.user._id || req.query.userId || req.user.userId,
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
            console.log('Transfer failed:', error);

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
            const { walletId } = req.params;
            const budgets = await Budget.find({ 
                walletId,
                userId: req.user._id || req.query.userId || req.user.userId
            });
            
            res.json({ budgets });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = WalletController;
