const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

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
            console.log('Wallet Controller - Fetching wallets for user ID(req.query.userId):', req.query.userId);
            const wallets = await Wallet.find({ 
                userId: req.query.userId || req.user.userId , 
                isActive: true 
            }).sort({ balance: -1 });

            console.log('Wallet Controller - Fetched wallets:', wallets);

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

            // Validate wallets belong to user
            const fromWallet = await Wallet.findOne({ 
                _id: fromWalletId, 
                userId: req.user._id || req.query.userId || req.user.userId,
            }).session(session);

            const toWallet = await Wallet.findOne({ 
                _id: toWalletId, 
                userId: req.user._id 
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

            // Update wallet balances
            fromWallet.balance -= amount;
            toWallet.balance += amount;

            await fromWallet.save({ session });
            await toWallet.save({ session });

            // Create transfer transaction
            const transferTransaction = new Transaction({
                userId: req.user._id,
                type: 'transfer',
                amount: -amount,
                fromWalletId,
                toWalletId,
                description: `Transfer from ${fromWallet.name} to ${toWallet.name}`
            });

            await transferTransaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.json({
                message: 'Balance transferred successfully',
                fromWallet,
                toWallet,
                transferTransaction
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            res.status(500).json({
                error: 'Balance transfer failed',
                details: error.message
            });
        }
    }
}

module.exports = WalletController;
