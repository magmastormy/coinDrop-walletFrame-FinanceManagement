const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Category = require('../models/Category');
const { performance } = require('perf_hooks');
const contextFormatter = require('./formatters/contextFormatter');
const cacheUtil = require('../utils/cacheUtil');
const logger = require('../utils/logger');

class ZhipuAIContextService {
  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  /**
   * Get user's financial context
   */
  async getUserFinancialContext(userId) {
    try {
      const wallets = await Wallet.find({ userId });
      const total = wallets.reduce((sum, w) => sum + w.balance, 0);
      const liquid = wallets
        .filter(w => ['checking', 'savings'].includes(w.type))
        .reduce((sum, w) => sum + w.balance, 0);
      return { total, liquid };
    } catch (error) {
      logger.error('Error getting financial context:', error);
      return { total: 0, liquid: 0 };
    }
  }

  /**
   * Find recurring transactions within a date range.
   */
  async findRecurringTransactionsAndDueDates(userId, startDate, endDate) {
    // Placeholder: return empty list
    return [];
  }

  /**
   * Find upcoming bills within a date range.
   */
  async findUpcomingBills(userId, startDate, endDate) {
    // Placeholder: return empty list
    return [];
  }

  /**
   * Get comprehensive user context for AI
   */
  async getContext(userId) {
    const t0 = performance.now();
    
    try {
      // Generate cache key
      const cacheKey = cacheUtil.generateKey('user_context', userId);
      
      // Try to get from cache first
      const cachedContext = await cacheUtil.get(cacheKey);
      if (cachedContext) {
        if (this.isDev) logger.debug(`[contextService:getContext] Cache hit for user ${userId}`);
        return cachedContext;
      }

      if (this.isDev) logger.debug(`[contextService:getContext] Cache miss for user ${userId}, fetching from database`);

      // Fetch all data in parallel to improve performance
      const [wallets, recentTransactions, budgets, savingsGoals, categories, savingsAccounts, monthlyTx, netWorth] = await Promise.all([
        // Fetch wallets with lean() for better performance
        Wallet.find({ userId }).lean().catch(error => {
          logger.error(`[contextService:getContext] Error fetching wallets: ${error.message}`);
          return [];
        }),
        // Fetch recent transactions with populate for category names
        Transaction.find({ userId })
          .sort({ date: -1 })
          .limit(10)
          .populate('category', 'name')
          .lean()
          .catch(error => {
            logger.error(`[contextService:getContext] Error fetching transactions: ${error.message}`);
            return [];
          }),
        // Fetch budgets with populated categories
        Budget.find({ userId })
          .populate('category', 'name')
          .lean()
          .catch(error => {
            logger.error(`[contextService:getContext] Error fetching budgets: ${error.message}`);
            return [];
          }),
        // Fetch savings goals
        SavingsGoal.find({ userId }).lean().catch(error => {
          logger.error(`[contextService:getContext] Error fetching savings goals: ${error.message}`);
          return [];
        }),
        // Fetch categories
        Category.find({ userId }).lean().catch(error => {
          logger.error(`[contextService:getContext] Error fetching categories: ${error.message}`);
          return [];
        }),
        // Fetch savings accounts
        SavingsAccount.find({ userId }).lean().catch(error => {
          logger.error(`[contextService:getContext] Error fetching savings accounts: ${error.message}`);
          return [];
        }),
        // Calculate monthly transactions
        this.getMonthlyTransactions(userId).catch(error => {
          logger.error(`[contextService:getContext] Error calculating monthly transactions: ${error.message}`);
          return { expenses: [], income: [] };
        }),
        // Calculate net worth
        this.calculateNetWorth(userId).catch(error => {
          logger.error(`[contextService:getContext] Error calculating net worth: ${error.message}`);
          return { total: 0, liquid: 0 };
        })
      ]);

      // Find recurring transactions and upcoming bills
      const [recurringTransactions, upcomingBills] = await Promise.all([
        this.findRecurringTransactionsAndDueDates(userId, monthlyTx.startDate, monthlyTx.endDate),
        this.findUpcomingBills(userId, monthlyTx.startDate, monthlyTx.endDate)
      ]);

      // Calculate financial summary
      const monthlyExpenses = monthlyTx.expenses.reduce((sum, tx) => sum + tx.amount, 0);
      const monthlyIncome = monthlyTx.income.reduce((sum, tx) => sum + tx.amount, 0);
      const netWorthMonth = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

      if (this.isDev) {
        logger.debug(`[contextService:getContext] Monthly stats - expenses: $${monthlyExpenses}, income: $${monthlyIncome}, savings rate: ${savingsRate.toFixed(1)}%`);
      }
      
      const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
      
      const context = {
        wallets,
        totalBalance,
        recentTransactions,
        budgets,
        savingsGoals,
        categories,
        netWorth,
        recurringTransactions,
        upcomingBills,
        savingsAccounts,
        financialSummary: { monthlyExpenses, monthlyIncome, savingsRate, netWorth: netWorthMonth }
      };

      // Cache the context for 5 minutes
      await cacheUtil.set(cacheKey, context, 300);
      if (this.isDev) logger.debug(`[contextService:getContext] Cached context for user ${userId}`);
      
      return context;
    } catch (error) {
      logger.error(`[contextService:getContext] Error fetching context: ${error.message}`);
      logger.error(error.stack);
      // Return minimal context to avoid breaking the app
      return {
        wallets: [],
        totalBalance: 0,
        recentTransactions: [],
        budgets: [],
        savingsGoals: [],
        categories: [],
        netWorth: { total: 0, liquid: 0 },
        recurringTransactions: [],
        upcomingBills: [],
        savingsAccounts: [],
        financialSummary: { monthlyExpenses: 0, monthlyIncome: 0, savingsRate: 0, netWorth: { total: 0, liquid: 0 } }
      };
    } finally {
      const t1 = performance.now();
      if (this.isDev) {
        logger.debug(`[contextService:getContext] Execution time: ${(t1 - t0).toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get monthly transactions for context
   */
  async getMonthlyTransactions(userId) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    }).lean();

    const expenses = transactions.filter(tx => tx.amount < 0);
    const income = transactions.filter(tx => tx.amount > 0);

    return {
      expenses,
      income,
      startDate,
      endDate
    };
  }

  /**
   * Calculate net worth
   */
  async calculateNetWorth(userId) {
    const wallets = await Wallet.find({ userId }).lean();
    const savingsAccounts = await SavingsAccount.find({ userId }).lean();
    
    const walletTotal = wallets.reduce((sum, w) => sum + w.balance, 0);
    const savingsTotal = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
    
    return {
      total: walletTotal + savingsTotal,
      liquid: wallets
        .filter(w => ['checking', 'savings'].includes(w.type))
        .reduce((sum, w) => sum + w.balance, 0) + savingsTotal
    };
  }
}

/**
 * Formats context into a text prompt for the AI.
 * @param {Object} ctx
 * @param {String} type - 'balance'|'budget'|'savings'|'bills'|'full'
 */
function formatContext(ctx, type = 'full') {
  // Delegate to the contextFormatter module
  return contextFormatter.formatContext(ctx, type);
}

/**
 * Generate context-based suggestions.
 * @param {Object} ctx - The context object containing financial data
 * @returns {Object} - Object containing suggestions
 */
async function generateContextSuggestions(ctx) {
  // Delegate to the contextFormatter module
  return contextFormatter.generateContextSuggestions(ctx);
}

/**
 * Module exports
 */
module.exports = { 
  ZhipuAIContextService,
  getContext: (userId) => new ZhipuAIContextService().getContext(userId),
  formatContext, 
  generateContextSuggestions 
};
