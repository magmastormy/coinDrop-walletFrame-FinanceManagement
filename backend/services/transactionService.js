const Transaction = require('../models/Transaction');
const BudgetService = require('./budgetService');
const mongoose = require('mongoose');
const cacheUtil = require('../utils/cacheUtil');

class TransactionService {
    /**
     * Get transactions by category with optional filters
     * @param {string} categoryId - Category ID
     * @param {Object} options - Optional filters
     * @param {Date} options.startDate - Start date for filtering
     * @param {Date} options.endDate - End date for filtering
     * @param {string} options.userId - User ID for filtering
     * @returns {Promise<Array>} Array of transactions
     */
    static async getTransactionsByCategory(categoryId, options = {}) {
        const query = { 
            $or: [
                { category: categoryId },
                { subcategory: categoryId }
            ]
        };
        
        if (options.startDate) query.date = { $gte: options.startDate };
        if (options.endDate) query.date = { ...query.date, $lte: options.endDate };
        if (options.userId) query.userId = options.userId;
        
        return Transaction.find(query)
            .populate('category subcategory')
            .sort({ date: -1 });
    }

    /**
     * Get transactions by budget with optional filters
     * @param {string} budgetId - Budget ID
     * @param {Object} options - Optional filters
     * @param {Date} options.startDate - Start date for filtering
     * @param {Date} options.endDate - End date for filtering
     * @returns {Promise<Array>} Array of transactions
     */
    static async getTransactionsByBudget(budgetId, options = {}) {
        const query = { budgetId, affectsBudget: true };
        
        if (options.startDate) query.date = { $gte: options.startDate };
        if (options.endDate) query.date = { ...query.date, $lte: options.endDate };
        
        return Transaction.find(query)
            .populate('category subcategory')
            .sort({ date: -1 });
    }

    /**
     * Recalculate budget after transaction change
     * @param {string} transactionId - Transaction ID
     * @returns {Promise<void>}
     */
    static async recalculateBudgetForTransaction(transactionId) {
        const transaction = await Transaction.findById(transactionId)
            .populate('budgetId');
        
        if (!transaction || !transaction.budgetId) return;

        await BudgetService.updateBudgetSpent(transaction.budgetId._id);
    }

    /**
     * Get spending analytics by category
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date for analysis
     * @param {Date} endDate - End date for analysis
     * @returns {Promise<Array>} Array of category spending data
     */
    static async getCategorySpending(userId, startDate, endDate) {
        const cacheKey = cacheUtil.generateKey('category_spending', userId, startDate, endDate);
        const cacheExpiration = 3600; // 1 hour

        // Try to get from cache first
        const cachedData = await cacheUtil.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const matchStage = {
            userId: mongoose.Types.ObjectId(userId),
            type: 'expense',
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const spending = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    categoryId: '$_id',
                    categoryName: '$category.name',
                    categoryIcon: '$category.icon',
                    categoryColor: '$category.color',
                    total: 1,
                    count: 1,
                    average: 1
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Cache the result
        if (spending) {
            await cacheUtil.set(cacheKey, spending, cacheExpiration);
        }

        return spending;
    }

    /**
     * Get monthly spending trend
     * @param {string} userId - User ID
     * @param {number} months - Number of months to analyze
     * @returns {Promise<Array>} Array of monthly spending data
     */
    static async getMonthlySpendingTrend(userId, months = 6) {
        const cacheKey = cacheUtil.generateKey('monthly_trend', userId, months);
        const cacheExpiration = 3600; // 1 hour

        // Try to get from cache first
        const cachedData = await cacheUtil.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const trends = await Transaction.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId),
                    type: 'expense',
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    total: 1,
                    count: 1
                }
            }
        ]);

        // Cache the result
        if (trends) {
            await cacheUtil.set(cacheKey, trends, cacheExpiration);
        }

        return trends;
    }

    /**
     * Find recurring transactions
     * @param {string} userId - User ID
     * @param {number} minOccurrences - Minimum number of occurrences to consider as recurring
     * @returns {Promise<Array>} Array of recurring transaction patterns
     */
    static async findRecurringTransactions(userId, minOccurrences = 2) {
        const cacheKey = cacheUtil.generateKey('recurring_transactions', userId, minOccurrences);
        const cacheExpiration = 3600; // 1 hour

        // Try to get from cache first
        const cachedData = await cacheUtil.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const transactions = await Transaction.find({
            userId,
            type: 'expense'
        })
        .populate('category')
        .sort({ date: -1 });

        // Group by amount and category
        const patterns = {};
        transactions.forEach(tx => {
            const key = `${tx.category?.name || 'uncategorized'}-${tx.amount}`;
            if (!patterns[key]) {
                patterns[key] = [];
            }
            patterns[key].push(tx);
        });

        // Filter for recurring patterns
        const recurring = Object.entries(patterns)
            .filter(([_, txs]) => txs.length >= minOccurrences)
            .map(([key, txs]) => ({
                category: key.split('-')[0],
                amount: parseFloat(key.split('-')[1]),
                occurrences: txs.length,
                lastOccurrence: txs[0].date,
                averageDaysBetween: this.calculateAverageDaysBetween(txs)
            }));

        // Cache the result
        if (recurring) {
            await cacheUtil.set(cacheKey, recurring, cacheExpiration);
        }

        return recurring;
    }

    /**
     * Calculate average days between transactions
     * @param {Array} transactions - Array of transactions
     * @returns {number|null} Average days between transactions or null if not enough data
     */
    static calculateAverageDaysBetween(transactions) {
        if (transactions.length < 2) return null;

        const sorted = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        let totalDays = 0;
        for (let i = 1; i < sorted.length; i++) {
            const diff = new Date(sorted[i-1].date) - new Date(sorted[i].date);
            totalDays += diff / (1000 * 60 * 60 * 24);
        }

        return Math.round(totalDays / (sorted.length - 1));
    }

    /**
     * Get transactions by date range with pagination
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date for filtering
     * @param {Date} endDate - End date for filtering
     * @param {Object} options - Optional parameters
     * @param {number} options.page - Page number
     * @param {number} options.limit - Number of items per page
     * @param {string} options.type - Transaction type
     * @param {string} options.category - Category ID
     * @param {string} options.walletId - Wallet ID
     * @param {string} options.sortBy - Field to sort by
     * @param {string} options.sortOrder - Sort order (asc or desc)
     * @returns {Promise<Object>} Paginated transactions with metadata
     */
    static async getTransactionsByDateRange(userId, startDate, endDate, options = {}) {
        const { page = 1, limit = 20, type, category, walletId, sortBy = 'date', sortOrder = 'desc' } = options;

        // Validate and sanitize inputs
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100); // Limit to 100 items per page

        const query = {
            userId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // Add optional filters
        if (type) query.type = type;
        if (category) query.category = category;
        if (walletId) query.walletId = walletId;

        // Build sort object
        const sortObject = {};
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Use lean() for better performance with large datasets
        const transactions = await Transaction.find(query)
            .populate('category walletId budgetId', 'name balance amount') // Select only necessary fields
            .sort(sortObject)
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean(); // Return plain JavaScript objects instead of Mongoose documents

        // Use countDocuments with the same query for accurate pagination
        const count = await Transaction.countDocuments(query);

        return {
            transactions,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            total: count,
            pageSize: limitNum
        };
    }

    /**
     * Get transactions with advanced filtering and pagination
     * @param {string} userId - User ID
     * @param {Object} filters - Filter parameters
     * @param {string} filters.type - Transaction type
     * @param {string} filters.category - Category ID
     * @param {string} filters.walletId - Wallet ID
     * @param {Date} filters.startDate - Start date for filtering
     * @param {Date} filters.endDate - End date for filtering
     * @param {number} filters.minAmount - Minimum amount
     * @param {number} filters.maxAmount - Maximum amount
     * @param {Object} options - Pagination and sorting options
     * @param {number} options.page - Page number
     * @param {number} options.limit - Number of items per page
     * @param {string} options.sortBy - Field to sort by
     * @param {string} options.sortOrder - Sort order (asc or desc)
     * @returns {Promise<Object>} Paginated transactions with metadata
     */
    static async getTransactionsWithFilters(userId, filters = {}, options = {}) {
        const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
        const { type, category, walletId, startDate, endDate, minAmount, maxAmount } = filters;

        // Validate and sanitize inputs
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        const query = { userId };

        // Add filters
        if (type) query.type = type;
        if (category) query.category = category;
        if (walletId) query.walletId = walletId;
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            query.amountDecrypted = {};
            if (minAmount !== undefined) query.amountDecrypted.$gte = parseFloat(minAmount);
            if (maxAmount !== undefined) query.amountDecrypted.$lte = parseFloat(maxAmount);
        }

        // Build sort object
        const sortObject = {};
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Use lean() for better performance
        const transactions = await Transaction.find(query)
            .populate('category walletId budgetId', 'name balance amount')
            .sort(sortObject)
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean();

        const count = await Transaction.countDocuments(query);

        return {
            transactions,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            total: count,
            pageSize: limitNum
        };
    }

    /**
     * Bulk update transactions
     * @param {Array} userIds - Array of user IDs
     * @param {Array} transactionIds - Array of transaction IDs
     * @param {Object} updates - Update parameters
     * @returns {Promise<Object>} Update result
     */
    static async bulkUpdateTransactions(userIds, transactionIds, updates) {
        const result = await Transaction.updateMany(
            {
                _id: { $in: transactionIds },
                userId: { $in: userIds }
            },
            { $set: updates }
        );

        // Recalculate affected budgets
        if (updates.budgetId || updates.amount || updates.type) {
            const affectedBudgets = await Transaction.distinct('budgetId', {
                _id: { $in: transactionIds }
            });

            for (const budgetId of affectedBudgets) {
                if (budgetId) {
                    await BudgetService.updateBudgetSpent(budgetId);
                }
            }
        }

        // Invalidate relevant caches
        for (const userId of userIds) {
            // Invalidate user context cache
            const contextCacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(contextCacheKey);
            
            // Invalidate analytics caches
            const categorySpendingPattern = cacheUtil.generateKey('category_spending', userId, '*');
            const monthlyTrendPattern = cacheUtil.generateKey('monthly_trend', userId, '*');
            const recurringPattern = cacheUtil.generateKey('recurring_transactions', userId, '*');
            
            await cacheUtil.clearByPattern(categorySpendingPattern);
            await cacheUtil.clearByPattern(monthlyTrendPattern);
            await cacheUtil.clearByPattern(recurringPattern);
        }

        return result;
    }

    /**
     * Soft delete transaction (mark as deleted without removing)
     * @param {string} transactionId - Transaction ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    static async softDeleteTransaction(transactionId, userId) {
        const result = await Transaction.updateOne(
            { _id: transactionId, userId },
            { 
                $set: { 
                    status: 'deleted',
                    deletedAt: new Date()
                }
            }
        );

        // Recalculate budget if applicable
        const transaction = await Transaction.findById(transactionId);
        if (transaction && transaction.budgetId) {
            await BudgetService.updateBudgetSpent(transaction.budgetId);
        }

        // Invalidate relevant caches
        if (transaction) {
            const userId = transaction.userId;
            // Invalidate user context cache
            const contextCacheKey = cacheUtil.generateKey('user_context', userId);
            await cacheUtil.del(contextCacheKey);
            
            // Invalidate analytics caches
            const categorySpendingPattern = cacheUtil.generateKey('category_spending', userId, '*');
            const monthlyTrendPattern = cacheUtil.generateKey('monthly_trend', userId, '*');
            const recurringPattern = cacheUtil.generateKey('recurring_transactions', userId, '*');
            
            await cacheUtil.clearByPattern(categorySpendingPattern);
            await cacheUtil.clearByPattern(monthlyTrendPattern);
            await cacheUtil.clearByPattern(recurringPattern);
        }

        return result;
    }
}

module.exports = TransactionService;
