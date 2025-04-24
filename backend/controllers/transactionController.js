const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const mongoose = require('mongoose');
const CategoryService = require('../services/categoryService');

class TransactionController {
    // Create a new transaction
    static async createTransaction(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;
            
            // Extract all required fields
            const { amount, type, category, description, walletId, date } = req.body;
            
            // Validate required fields
            if (!amount || !type) { 
                return res.status(400).json({ 
                    error: 'Transaction creation failed',
                    details: 'Amount and type are required' 
                });
            }
            
            // 1. Validate category
            const finalCategory = await CategoryService.handleCategory(category, userId);
            
            // Create the transaction with validated data
            const transactionData = {
                userId,
                amount: parseFloat(amount),
                type,
                category: finalCategory._id,
                description,
                walletId,
                date: date || new Date()
            };
            
            const transaction = new Transaction(transactionData);
            await transaction.save();
            
            // Update wallet balance if provided
            let wallet = null;
            if (walletId) {
                wallet = await Wallet.findById(walletId);
                if (wallet) {
                    if (type === 'expense') {
                        wallet.balance -= parseFloat(amount);
                    } else if (type === 'income') {
                        wallet.balance += parseFloat(amount);
                    }
                    await wallet.save();
                }
            }
            
            // Find and update any matching budget by category
            if (finalCategory.name) {
                const matchingBudget = await Budget.findOne({
                    userId,
                    category: finalCategory.name,
                    walletId
                });
                
                if (matchingBudget) {
                    await matchingBudget.updateTotalSpent(parseFloat(amount), type);
                }
            }
            
            res.status(201).json({ 
                message: 'Transaction created successfully',
                transaction,
                wallet
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

            const userId = req.user._id || req.query.userId || req.user.userId;

            const { budgetId } = req.params;
            const { amount, type, category, description } = req.body;
    
            if (!amount || !type || !category) { // Add required fields validation
                return res.status(400).json({ error: 'Amount, type, and category are required.' });
            }
    
            const budget = await Budget.findOne({
                _id: budgetId,
                userId: userId,
            }).session(session);
    
            if (!budget) {
                throw new Error('Budget not found');
            }
    
            // Get wallet from budget
            const wallet = await Wallet.findById(budget.walletId).session(session);
            
            if (!wallet) {
                throw new Error('Associated wallet not found');
            }
    
            // 1. Validate category
            const finalCategory = await CategoryService.handleCategory(category, userId);
    
            // Create transaction
            const transaction = new Transaction({
                userId: userId,
                budgetId,
                walletId: wallet._id, // This will be removed later
                amount,
                type,
                category: finalCategory._id,
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
            await budget.updateTotalSpent(amount, type);
    
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
                endDate,
                walletId,
                minAmount,
                maxAmount
            } = req.query;

            const filter = { userId: req.user._id || req.query.userId || req.user.userId};

            // Optional filters
            if (type) filter.type = type;
            if (category) filter.category = mongoose.Types.ObjectId(category);
            if (walletId) filter.walletId = walletId;
            
            if (startDate && endDate) {
                filter.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .populate('walletId', 'name balance');

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
                { 
                    _id: id, 
                    userId: req.user._id || req.query.userId || req.user.userId,
                },
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
                userId: req.user._id || req.query.userId || req.user.userId,
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
            const userId = req.user._id || req.query.userId || req.user.userId;

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
            const userId = req.user._id || req.query.userId || req.user.userId;
            const { budgetId } = req.params;
            const budget = await Budget.findOne({ 
                _id: budgetId,
                userId: userId,
            });

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            const transactions = await Transaction.find({
                budgetId,
                userId: userId,
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
            const userId = req.user._id || req.query.userId || req.user.userId;
            const { budgetId } = req.params;
            const { amount, type, category, description } = req.body;

            const budget = await Budget.findOne({
                _id: budgetId,
                userId: userId,
            }).session(session);

            if (!budget) {
                throw new Error('Budget not found');
            }

            // Get wallet from budget
            const wallet = await Wallet.findById(budget.walletId).session(session);
            
            if (!wallet) {
                throw new Error('Associated wallet not found');
            }

            // 1. Validate category
            const finalCategory = await CategoryService.handleCategory(category, userId);

            // Create transaction
            const transaction = new Transaction({
                userId: userId,
                budgetId,
                walletId: wallet._id,
                amount,
                type,
                category: finalCategory._id,
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
            await budget.updateTotalSpent(amount, type);

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
