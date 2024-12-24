const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

class TransactionController {
    // Create a new transaction
    static async createTransaction(req, res) {
        try {
            const { budgetId, walletId, ...transactionData } = req.body;
            
            // Verify walletId and budgetId are valid and belong to the user
            const budget = await Budget.findById(budgetId).session(session);
            const wallet = await Wallet.findById(walletId).session(session);
    
            if (!budget || !wallet || budget.userId.toString() !== req.user._id.toString() || wallet.userId.toString() !== req.user._id.toString()) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: 'Invalid budgetId or walletId' });
            }
    
            // Ensure walletId matches the wallet associated with the budget
            if (budget.walletId.toString() !== walletId) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: 'Wallet does not match the budget' });
            }
    
            // Create the transaction
            const transaction = new Transaction({
                ...transactionData,
                budgetId,
                walletId,
                userId: req.user._id
            });
            await transaction.save({ session });
    
            await session.commitTransaction();
            session.endSession();
    
            res.status(201).json({
                message: 'Transaction created successfully',
                transaction
            });
        } catch (error) {
            res.status(400).json({
                error: 'Transaction creation failed',
                details: error.message
            });
        }
    }
    
    static async createTransactionForBudget(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const { budgetId } = req.params;
            const { amount, type, category, description } = req.body;
    
            if (!amount || !type || !category) { // Add required fields validation
                return res.status(400).json({ error: 'Amount, type, and category are required.' });
            }
    
            const budget = await Budget.findOne({
                _id: budgetId,
                userId: req.user._id
            }).session(session);
    
            if (!budget) {
                throw new Error('Budget not found');
            }
    
            // Get wallet from budget
            const wallet = await Wallet.findById(budget.walletId).session(session);
            
            if (!wallet) {
                throw new Error('Associated wallet not found');
            }
    
            // Create transaction
            const transaction = new Transaction({
                userId: req.user._id,
                budgetId,
                walletId: wallet._id, // This will be removed later
                amount,
                type,
                category,
                description,
                date: new Date()
            });
    
            await transaction.save({ session });
    
            // Update wallet balance
            if (type === 'expense') {
                wallet.balance -= amount;
            } else if (type === 'income') {
                wallet.balance += amount;
            }
            
            await wallet.save({ session });
    
            // Update budget spent amount
            await budget.updateTotalSpent(amount);
    
            await session.commitTransaction();
    
            res.json({ transaction, wallet, budget });
    
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ error: 'Transaction creation failed', details: error.message });
        } finally {
            session.endSession();
        }
    }

    // Get all transactions for a user
    static async getUserTransactions(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                type, 
                category, 
                startDate, 
                endDate 
            } = req.query;

            const filter = { userId: req.user._id };

            // Optional filters
            if (type) filter.type = type;
            if (category) filter.category = category;
            
            if (startDate && endDate) {
                filter.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Transaction.countDocuments(filter);

            res.json({
                transactions,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve transactions',
                details: error.message
            });
        }
    }

    // Update a transaction
    static async updateTransaction(req, res) {
        try {
            const { id } = req.params;

            // Ensure transaction belongs to the user
            const transaction = await Transaction.findOneAndUpdate(
                { _id: id, userId: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction not found or unauthorized' 
                });
            }

            res.json({
                message: 'Transaction updated successfully',
                transaction
            });
        } catch (error) {
            res.status(400).json({
                error: 'Transaction update failed',
                details: error.message
            });
        }
    }

    // Delete a transaction
    static async deleteTransaction(req, res) {
        try {
            const { id } = req.params;

            const transaction = await Transaction.findOneAndDelete({
                _id: id,
                userId: req.user._id
            });

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction not found or unauthorized' 
                });
            }

            res.json({
                message: 'Transaction deleted successfully',
                transaction
            });
        } catch (error) {
            res.status(500).json({
                error: 'Transaction deletion failed',
                details: error.message
            });
        }
    }

    // Get transaction statistics
    static async getTransactionStats(req, res) {
        try {
            const userId = req.user._id;

            const stats = await Transaction.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.json({ stats });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve transaction statistics',
                details: error.message
            });
        }
    }

    static async getTransactionsByBudget(req, res) {
        try {
            const { budgetId } = req.params;
            const budget = await Budget.findOne({ 
                _id: budgetId,
                userId: req.user._id
            });

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            const transactions = await Transaction.find({
                budgetId,
                userId: req.user._id
            }).populate('walletId');

            // Calculate budget progress
            const totalSpent = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
            const remainingAmount = budget.amount - totalSpent;
            const progressPercentage = (totalSpent / budget.amount) * 100;

            res.json({
                budget,
                transactions,
                progress: {
                    total: budget.amount,
                    spent: totalSpent,
                    remaining: remainingAmount,
                    percentage: progressPercentage
                }
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createTransactionForBudget(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { budgetId } = req.params;
            const { amount, type, category, description } = req.body;

            const budget = await Budget.findOne({
                _id: budgetId,
                userId: req.user._id
            }).session(session);

            if (!budget) {
                throw new Error('Budget not found');
            }

            // Get wallet from budget
            const wallet = await Wallet.findById(budget.walletId).session(session);
            
            if (!wallet) {
                throw new Error('Associated wallet not found');
            }

            // Create transaction
            const transaction = new Transaction({
                userId: req.user._id,
                budgetId,
                walletId: wallet._id,
                amount,
                type,
                category,
                description,
                date: new Date()
            });

            await transaction.save({ session });

            // Update wallet balance
            if (type === 'expense') {
                wallet.balance -= amount;
            } else if (type === 'income') {
                wallet.balance += amount;
            }
            
            await wallet.save({ session });

            // Update budget spent amount
            await budget.updateTotalSpent(amount);

            await session.commitTransaction();

            res.json({ transaction, wallet, budget });

        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};


module.exports = TransactionController;
