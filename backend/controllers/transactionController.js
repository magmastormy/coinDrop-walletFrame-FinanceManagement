const logger = require('../utils/logger');

/**
 * Transaction Controller
 * Handles transaction-related operations including creation, retrieval, updating, and deletion
 */
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const mongoose = require('mongoose');
const CategoryService = require('../services/categoryService');
const TransactionService = require('../services/transactionService');
const { executeRulesForTransaction } = require('../services/savingsRuleExecutor');
const { addTransactionToQueue, getJobStatus } = require('../services/transactionQueueService');
const { getAuthenticatedUserId } = require('../utils/authUser');
const { ErrorHandler } = require('../utils/errorHandler');
const cacheUtil = require('../utils/cacheUtil');
const isDev = process.env.NODE_ENV !== 'production';

class TransactionController {
    /**
     * Create a new transaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async createTransaction(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { amount, type, category, description, walletId, date, savingsAccountId } = req.body;

            // Validate required fields
            if (!amount || !type) {
                const validationError = ErrorHandler.createError('Amount and type are required', 400);
                return res.status(validationError.statusCode).json({
                    status: validationError.status,
                    message: validationError.message
                });
            }

            // Add transaction to queue
            const transactionData = {
                userId,
                amount,
                type,
                category,
                description,
                walletId,
                savingsAccountId,
                date: date || new Date()
            };

            const job = await addTransactionToQueue(transactionData);

            res.status(202).json({ 
                message: 'Transaction queued for processing',
                jobId: job.id,
                status: 'pending'
            });
        } catch (error) {
            logger.error('Transaction creation failed:', {
                error: error.message,
                stack: error.stack,
                userId: getAuthenticatedUserId(req)
            });
            const serverError = ErrorHandler.createError('Transaction creation failed', 400);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message,
                details: error.message
            });
        }
    }

    /**
     * Get transaction status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getTransactionStatus(req, res) {
        try {
            const { jobId } = req.params;
            const status = await getJobStatus(jobId);
            res.json(status);
        } catch (error) {
            logger.error('Failed to get transaction status:', {
                error: error.message,
                stack: error.stack,
                jobId: req.params.jobId
            });
            const serverError = ErrorHandler.createError('Failed to get transaction status', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message,
                details: error.message
            });
        }
    }

    /**
     * Validate transaction input
     * @param {Object} req - Express request object
     * @returns {number} Parsed amount
     * @throws {Error} If validation fails
     */
    static validateTransactionInput(req) {
        const { amount, type, category } = req.body;
        
        // Validate required fields upfront
        if (!amount || !type || !category) {
            throw ErrorHandler.createError('Amount, type, and category are required', 400);
        }
        
        // Validate amount is positive number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw ErrorHandler.createError('Amount must be a positive number', 400);
        }
        
        return parsedAmount;
    }
    
    /**
     * Validate budget
     * @param {string} budgetId - Budget ID
     * @param {string} userId - User ID
     * @param {Date} txDate - Transaction date
     * @param {string} type - Transaction type
     * @param {Object} session - Mongoose session
     * @returns {Object} Budget object
     * @throws {Error} If validation fails
     */
    static async validateBudget(budgetId, userId, txDate, type, session) {
        // Fetch budget FIRST to validate before creating transaction
        const budget = await Budget.findOne({
            _id: budgetId,
            userId: userId,
        }).session(session);
    
        if (!budget) {
            throw ErrorHandler.createError('Budget not found or unauthorized', 404);
        }
    
        // Validate budget is active
        if (!budget.isActive) {
            throw ErrorHandler.createError('Cannot create transaction for inactive budget', 400);
        }
    
        // Validate budget period includes the transaction date
        if (txDate < budget.startDate || (budget.endDate && txDate > budget.endDate)) {
            throw ErrorHandler.createError(
                `Transaction date outside budget period. Budget period: ${budget.startDate.toISOString()} to ${budget.endDate ? budget.endDate.toISOString() : 'present'}`,
                400
            );
        }
    
        // Validate budget type matches transaction type
        if (budget.type !== type) {
            throw ErrorHandler.createError(
                `Transaction type does not match budget type. Budget is for ${budget.type} transactions, but transaction is ${type}`,
                400
            );
        }
        
        return budget;
    }
    
    /**
     * Validate wallet
     * @param {Object} budget - Budget object
     * @param {string} userId - User ID
     * @param {string} type - Transaction type
     * @param {number} amount - Transaction amount
     * @param {Object} session - Mongoose session
     * @returns {Object} Wallet object
     * @throws {Error} If validation fails
     */
    static async validateWallet(budget, userId, type, amount, session) {
        // Get wallet from budget
        const wallet = await Wallet.findOne({ 
            _id: budget.walletId, 
            userId, 
            isActive: true 
        }).session(session);
        
        if (!wallet) {
            throw ErrorHandler.createError('Associated wallet not found or inactive', 404);
        }
    
        // Validate sufficient funds for expenses
        if (type === 'expense' && wallet.balance < amount) {
            throw ErrorHandler.createError(
                `Insufficient funds in wallet. Wallet balance: $${wallet.balance.toFixed(2)}, Required: $${amount.toFixed(2)}`,
                400
            );
        }
        
        return wallet;
    }
    
    /**
     * Validate category
     * @param {string|Object} category - Category ID or object
     * @param {Object} budget - Budget object
     * @param {string} userId - User ID
     * @param {Object} session - Mongoose session
     * @returns {Object} Category object
     * @throws {Error} If validation fails
     */
    static async validateCategory(category, budget, userId, session) {
        // Validate category matches budget category
        const finalCategory = await CategoryService.handleCategory(category, userId);
        
        if (finalCategory._id.toString() !== budget.category.toString()) {
            // Check if it's a subcategory of the budget category
            const budgetCategory = await Category.findById(budget.category).session(session);
            
            if (!budgetCategory || !budgetCategory.children?.some(child => 
                child._id.toString() === finalCategory._id.toString()
            )) {
                throw ErrorHandler.createError(
                    'Transaction category does not match budget category. Category must match budget category or be a subcategory of it',
                    400
                );
            }
        }
        
        return finalCategory;
    }
    
    /**
     * Create a transaction for a budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async createTransactionForBudget(req, res) {
        // Check if we can use transactions (requires replica set)
        const useTransaction = process.env.MONGODB_REPLICA_SET || false;
        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) {
            session.startTransaction();
        }
    
        try {
            const userId = getAuthenticatedUserId(req);
            const { budgetId } = req.params;
            const { type, category, description, date } = req.body;
            
            // Validate input
            const parsedAmount = this.validateTransactionInput(req);
            
            // Validate date
            const txDate = date ? new Date(date) : new Date();
            
            // Validate budget
            const budget = await this.validateBudget(budgetId, userId, txDate, type, session);
            
            // Validate wallet
            const wallet = await this.validateWallet(budget, userId, type, parsedAmount, session);
            
            // Validate category
            const finalCategory = await this.validateCategory(category, budget, userId, session);
            
            // All validations passed - now create transaction
            const transaction = new Transaction({
                userId: userId,
                budgetId,
                walletId: wallet._id,
                amount: parsedAmount,
                type,
                category: finalCategory._id,
                description,
                date: txDate
            });
    
            await transaction.save({ session });
    
            // Update wallet balance
            if (type === 'expense') {
                wallet.balance -= parsedAmount;
            } else if (type === 'income') {
                wallet.balance += parsedAmount;
            }
            
            await wallet.save({ session });
    
            // Update budget spent amount AFTER successful transaction creation
            await budget.updateTotalSpent(parsedAmount, type);
    
            if (session) {
                await session.commitTransaction();
            }

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[transactionController] Invalidated cache for user ${userId}`);

            res.status(201).json({ 
                success: true,
                message: 'Transaction created successfully',
                data: { transaction, wallet, budget }
            });
    
        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }
            
            logger.error('Transaction creation failed:', {
                error: error.message,
                stack: error.stack,
                userId: getAuthenticatedUserId(req)
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ 
                error_code: 'TRANSACTION_CREATION_FAILED',
                message: error.message || 'Failed to create transaction',
                details: error.message 
            });
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    /**
     * Get all transactions for a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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
                maxAmount,
                sortBy = 'date',
                sortOrder = 'desc'
            } = req.query;

            // Validate category ID if provided
            if (category && !mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid category filter',
                    message: 'Please provide a valid category ID'
                });
            }

            // Validate wallet ID if provided
            if (walletId && !mongoose.Types.ObjectId.isValid(walletId)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid wallet filter',
                    message: 'Please provide a valid wallet ID'
                });
            }

            // Validate date range if provided
            if (startDate && endDate) {
                const parsedStart = new Date(startDate);
                const parsedEnd = new Date(endDate);
                if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Invalid date range filter',
                        message: 'Please provide valid start and end dates'
                    });
                }
            }

            // Validate amount filters if provided
            if (minAmount || maxAmount) {
                const minAmountNum = minAmount !== undefined ? Number(minAmount) : null;
                const maxAmountNum = maxAmount !== undefined ? Number(maxAmount) : null;
                if (
                    (minAmount !== undefined && !Number.isFinite(minAmountNum)) ||
                    (maxAmount !== undefined && !Number.isFinite(maxAmountNum))
                ) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Invalid amount filter',
                        message: 'Please provide valid minimum and maximum amount values'
                    });
                }
            }

            // Prepare filters
            const filters = {
                type,
                category: category ? new mongoose.Types.ObjectId(category) : undefined,
                walletId,
                startDate,
                endDate,
                minAmount,
                maxAmount
            };

            // Prepare options
            const options = {
                page,
                limit,
                sortBy,
                sortOrder
            };

            // Use the optimized service method
            const result = await TransactionService.getTransactionsWithFilters(userId, filters, options);

            res.json({
                success: true,
                message: result.transactions.length > 0 ? 'Transactions retrieved successfully' : 'No transactions found',
                data: {
                    transactions: result.transactions,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    totalTransactions: result.total,
                    pageSize: result.pageSize
                }
            });
        } catch (error) {
            const currentUserId = getAuthenticatedUserId(req);
            logger.error('Failed to retrieve transactions:', {
                error: error.message,
                stack: error.stack,
                userId: currentUserId
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve transactions',
                message: 'An error occurred while fetching transactions',
                details: error.message
            });
        }
    }

    /**
     * Update a transaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[transactionController] Invalidated cache for user ${userId}`);

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

    /**
     * Delete a transaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[transactionController] Invalidated cache for user ${userId}`);

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

    /**
     * Get transaction statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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

            // Ensure all transaction types are represented even if no data exists
            const transactionTypes = ['income', 'expense', 'transfer'];
            const completeStats = transactionTypes.map(type => {
                const existingStat = stats.find(stat => stat._id === type);
                return existingStat || {
                    _id: type,
                    totalAmount: 0,
                    count: 0
                };
            });

            res.json({
                success: true,
                message: stats.length > 0 ? 'Transaction statistics retrieved successfully' : 'No transaction data available',
                data: {
                    stats: completeStats,
                    totalTransactions: completeStats.reduce((sum, stat) => sum + stat.count, 0),
                    totalAmount: completeStats.reduce((sum, stat) => sum + stat.totalAmount, 0)
                }
            });
        } catch (error) {
            logger.error('Failed to retrieve transaction statistics:', {
                error: error.message,
                stack: error.stack,
                userId: getAuthenticatedUserId(req)
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve transaction statistics',
                message: 'An error occurred while fetching transaction statistics',
                details: error.message
            });
        }
    }

    /**
     * Get transactions by budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getTransactionsByBudget(req, res) {
        const { budgetId } = req.params;
        try {
            const userId = getAuthenticatedUserId(req);

            // Validate budgetId exists and belongs to user
            const budget = await Budget.findOne({ 
                _id: budgetId,
                userId: userId 
            });

            if (!budget) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Budget not found',
                    message: 'The specified budget does not exist or does not belong to you'
                });
            }

            // Find transactions related to this budget
            const transactions = await Transaction.find({
                userId: userId,
                budgetId: budgetId
            })
            .populate('category')
            .populate('walletId')
            .sort({ date: -1 });

            res.json({
                success: true,
                message: transactions.length > 0 ? 'Budget transactions retrieved successfully' : 'No transactions found for this budget',
                data: {
                    transactions,
                    budgetId: budget._id,
                    budgetName: budget.name,
                    totalTransactions: transactions.length
                }
            });
        } catch (error) {
            const currentUserId = getAuthenticatedUserId(req);
            logger.error('Error fetching budget transactions', {
                error: error.message,
                stack: error.stack,
                userId: currentUserId,
                budgetId: budgetId
            });
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch budget transactions',
                message: 'An error occurred while fetching budget transactions',
                details: error.message
            });
        }
    }

    /**
     * Get uncategorized transactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async getUncategorizedTransactions(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);

            // Find transactions without category
            const transactions = await Transaction.find({
                userId: userId,
                category: { $in: [null, undefined, ''] }
            })
            .populate('walletId')
            .sort({ date: -1 });

            res.json({
                success: true,
                message: transactions.length > 0 ? 'Uncategorized transactions retrieved successfully' : 'No uncategorized transactions found',
                data: {
                    transactions,
                    totalUncategorized: transactions.length
                }
            });
        } catch (error) {
            const currentUserId = getAuthenticatedUserId(req);
            logger.error('Error fetching uncategorized transactions', {
                error: error.message,
                stack: error.stack,
                userId: currentUserId
            });
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch uncategorized transactions',
                message: 'An error occurred while fetching uncategorized transactions',
                details: error.message
            });
        }
    }

    /**
     * Bulk update transactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async bulkUpdateTransactions(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { transactionIds, updateData } = req.body;

            // Validate input
            if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
                return res.status(400).json({ 
                    error: 'Invalid transaction IDs',
                    details: 'Must provide an array of transaction IDs' 
                });
            }

            if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
                return res.status(400).json({ 
                    error: 'Invalid update data',
                    details: 'Must provide update data' 
                });
            }

            // Validate all IDs belong to the user
            const validIds = await Transaction.find({
                _id: { $in: transactionIds },
                userId
            }).distinct('_id');

            if (validIds.length !== transactionIds.length) {
                return res.status(403).json({ 
                    error: 'Unauthorized',
                    details: 'Some transactions do not belong to the user or do not exist' 
                });
            }

            // Perform the bulk update
            const result = await Transaction.updateMany(
                { _id: { $in: transactionIds } },
                updateData
            );

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[transactionController] Invalidated cache for user ${userId}`);

            res.json({
                message: 'Bulk update successful',
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            logger.error('Bulk update failed', {
                error: error.message,
                stack: error.stack,
                userId: getAuthenticatedUserId(req)
            });
            res.status(500).json({ 
                error: 'Bulk update failed',
                details: error.message
            });
        }
    }

    /**
     * Bulk delete transactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async bulkDeleteTransactions(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { transactionIds } = req.body;

            // Validate input
            if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
                return res.status(400).json({ 
                    error: 'Invalid transaction IDs',
                    details: 'Must provide an array of transaction IDs' 
                });
            }

            // Validate all IDs belong to the user
            const validIds = await Transaction.find({
                _id: { $in: transactionIds },
                userId
            }).distinct('_id');

            if (validIds.length !== transactionIds.length) {
                return res.status(403).json({ 
                    error: 'Unauthorized',
                    details: 'Some transactions do not belong to the user or do not exist' 
                });
            }

            // Perform the bulk delete
            const result = await Transaction.deleteMany(
                { _id: { $in: transactionIds } }
            );

            // Invalidate user context cache
            const cacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(cacheKey);
            if (isDev) logger.debug(`[transactionController] Invalidated cache for user ${userId}`);

            res.json({
                message: 'Bulk delete successful',
                deletedCount: result.deletedCount
            });
        } catch (error) {
            logger.error('Bulk delete failed', {
                error: error.message,
                stack: error.stack,
                userId: getAuthenticatedUserId(req)
            });
            res.status(500).json({ 
                error: 'Bulk delete failed',
                details: error.message
            });
        }
    }
};



module.exports = TransactionController;
