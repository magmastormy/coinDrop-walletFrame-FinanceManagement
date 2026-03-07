const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const mongoose = require('mongoose');
const CategoryService = require('../services/categoryService');
const { executeRulesForTransaction } = require('../services/savingsRuleExecutor');
const { getAuthenticatedUserId } = require('../utils/authUser');
const isDev = process.env.NODE_ENV !== 'production';

class TransactionController {
    // Create a new transaction
    static async createTransaction(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { amount, type, category, description, walletId, date } = req.body;

            // Validate required fields
            if (!amount || !type) {
                return res.status(400).json({ 
                    error: 'Transaction creation failed',
                    details: 'Amount and type are required' 
                });
            }

            // If category is provided, validate it as an ID
            let finalCategory;
            if (category) {
                finalCategory = await Category.findOne({ _id: category, userId });
                if (!finalCategory) {
                    return res.status(400).json({ 
                        error: 'Transaction creation failed',
                        details: 'Invalid category ID for current user' 
                    });
                }
            } 
            // If no category but description exists, use AI fallback
            else if (description && description.trim()) {
                try {
                    const suggestedCategory = await CategoryService.suggestCategory(description);
                    if (isDev) console.log('[TransactionController - createTransaction] AI category suggestion generated');
                    finalCategory = await CategoryService.handleCategory(suggestedCategory, userId);
                } catch (aiErr) {
                    console.error(`Category AI suggestion failed: ${aiErr.message}`);
                    return res.status(400).json({ 
                        error: 'Transaction creation failed',
                        details: 'Failed to suggest a category from the description' 
                    });
                }
            } else {
                return res.status(400).json({ 
                    error: 'Transaction creation failed',
                    details: 'Please provide a category or description' 
                });
            }

            // Create the transaction
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
                wallet = await Wallet.findOne({ _id: walletId, userId, isActive: true });
                if (!wallet) {
                    return res.status(404).json({
                        error: 'Transaction creation failed',
                        details: 'Wallet not found for current user'
                    });
                }

                if (type === 'expense') {
                    wallet.balance -= parseFloat(amount);
                } else if (type === 'income') {
                    wallet.balance += parseFloat(amount);
                }
                await wallet.save();
            }

            // Update budget (if category and walletId are provided)
            if (finalCategory._id && walletId) {
                const matchingBudget = await Budget.findOne({
                    userId,
                    category: finalCategory._id,
                    walletId
                });
                if (matchingBudget) {
                    await matchingBudget.updateTotalSpent(amount, type);
                }
            }

            // Execute savings rules
            let autoSavings;
            try {
                autoSavings = await executeRulesForTransaction(userId, transaction.toObject());
            } catch (err) {
                console.error(`Auto savings error: ${err.message}`);
                autoSavings = { executed: 0, details: [], error: err.message };
            }

            res.status(201).json({ 
                message: 'Transaction created successfully',
                transaction,
                wallet,
                autoSavings
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

            const userId = getAuthenticatedUserId(req);

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
            const wallet = await Wallet.findOne({ _id: budget.walletId, userId, isActive: true }).session(session);
            
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
            const userId = getAuthenticatedUserId(req);
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

            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
            const filter = { userId };

            // Optional filters
            if (type) filter.type = type;
            if (category) {
                if (!mongoose.Types.ObjectId.isValid(category)) {
                    return res.status(400).json({ error: 'Invalid category filter' });
                }
                filter.category = new mongoose.Types.ObjectId(category);
            }
            if (walletId) {
                if (!mongoose.Types.ObjectId.isValid(walletId)) {
                    return res.status(400).json({ error: 'Invalid wallet filter' });
                }
                filter.walletId = walletId;
            }
            
            if (startDate && endDate) {
                const parsedStart = new Date(startDate);
                const parsedEnd = new Date(endDate);
                if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
                    return res.status(400).json({ error: 'Invalid date range filter' });
                }

                filter.date = {
                    $gte: parsedStart,
                    $lte: parsedEnd
                };
            }

            const minAmountNum = minAmount !== undefined ? Number(minAmount) : null;
            const maxAmountNum = maxAmount !== undefined ? Number(maxAmount) : null;
            if (
                (minAmount !== undefined && !Number.isFinite(minAmountNum)) ||
                (maxAmount !== undefined && !Number.isFinite(maxAmountNum))
            ) {
                return res.status(400).json({ error: 'Invalid amount filter' });
            }

            if (minAmountNum !== null || maxAmountNum !== null) {
                filter.amount = {};
                if (minAmountNum !== null) filter.amount.$gte = minAmountNum;
                if (maxAmountNum !== null) filter.amount.$lte = maxAmountNum;
            }

            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('walletId', 'name balance');

            const total = await Transaction.countDocuments(filter);

            res.json({
                transactions,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum
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
            const userId = getAuthenticatedUserId(req);

            // Ensure transaction belongs to the user
            const transaction = await Transaction.findOneAndUpdate(
                { 
                    _id: id, 
                    userId,
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
            const userId = getAuthenticatedUserId(req);

            const transaction = await Transaction.findOneAndDelete({
                _id: id,
                userId,
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
            const userId = getAuthenticatedUserId(req);

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
            const userId = getAuthenticatedUserId(req);

            // Validate budgetId exists and belongs to user
            const budget = await Budget.findOne({ 
                _id: budgetId,
                userId: userId 
            });

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            // Find transactions related to this budget
            const transactions = await Transaction.find({
                userId: userId,
                budgetId: budgetId
            })
            .populate('category')
            .populate('walletId')
            .sort({ date: -1 });

            res.json({ transactions });
        } catch (error) {
            console.error(`[TransactionController] Error fetching budget transactions: ${error.message}`);
            res.status(500).json({ 
                error: 'Failed to fetch budget transactions',
                details: error.message
            });
        }
    }

};


module.exports = TransactionController;
