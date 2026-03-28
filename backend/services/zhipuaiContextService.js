const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Category = require('../models/Category');
const { performance } = require('perf_hooks');
const contextFormatter = require('./formatters/contextFormatter');
const cacheUtil = require('../utils/cacheUtil');
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Calculate user's net worth.
 */
async function calculateNetWorth(userId) {
  const wallets = await Wallet.find({ userId });
  const total = wallets.reduce((sum, w) => sum + w.balance, 0);
  const liquid = wallets
    .filter(w => ['checking', 'savings'].includes(w.type))
    .reduce((sum, w) => sum + w.balance, 0);
  return { total, liquid };
}

/**
 * Find recurring transactions within a date range.
 */
async function findRecurringTransactionsAndDueDates(userId, startDate, endDate) {
  // Placeholder: return empty list
  return [];
}

/**
 * Find upcoming bills within a date range.
 */
async function findUpcomingBills(userId, startDate, endDate) {
  // Placeholder: return empty list
  return [];
}

/**
 * Gather full user financial context.
 * @param {String} userId
 */
async function getContext(userId) {
  if (isDev) console.log(`[contextService:getContext] Fetching context for user ${userId}`);
  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Check if userId is valid
    if (!userId) {
      console.error('[contextService:getContext] ERROR: No userId provided');
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
    }

    // Generate cache key
    const cacheKey = cacheUtil.generateKey('user_context', userId);
    
    // Try to get from cache first
    const cachedContext = await cacheUtil.get(cacheKey);
    if (cachedContext) {
      if (isDev) console.log(`[contextService:getContext] Cache hit for user ${userId}`);
      return cachedContext;
    }

    if (isDev) console.log(`[contextService:getContext] Cache miss for user ${userId}, fetching from database`);

    // Fetch all data in parallel to improve performance
    const [wallets, recentTransactions, budgets, savingsGoals, categories, savingsAccounts, monthlyTx, netWorth] = await Promise.all([
      // Fetch wallets with lean() for better performance
      Wallet.find({ userId }).lean().catch(error => {
        console.error(`[contextService:getContext] Error fetching wallets: ${error.message}`);
        return [];
      }),
      // Fetch recent transactions with populate for category names
      Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(10)
        .populate('category', 'name')
        .lean()
        .catch(error => {
          console.error(`[contextService:getContext] Error fetching transactions: ${error.message}`);
          return [];
        }),
      // Fetch budgets with populated categories
      Budget.find({ userId })
        .populate('category', 'name')
        .lean()
        .catch(error => {
          console.error(`[contextService:getContext] Error fetching budgets: ${error.message}`);
          return [];
        }),
      // Fetch savings goals
      SavingsGoal.find({ userId }).lean().catch(error => {
        console.error(`[contextService:getContext] Error fetching savings goals: ${error.message}`);
        return [];
      }),
      // Fetch categories
      Category.find({ userId }).lean().catch(error => {
        console.error(`[contextService:getContext] Error fetching categories: ${error.message}`);
        return [];
      }),
      // Fetch savings accounts
      SavingsAccount.find({ userId }).lean().catch(error => {
        console.error(`[contextService:getContext] Error fetching savings accounts: ${error.message}`);
        return [];
      }),
      // Fetch monthly transactions for summary
      Transaction.find({ userId, date: { $gte: firstOfMonth } })
        .lean()
        .catch(error => {
          console.error(`[contextService:getContext] Error fetching monthly transactions: ${error.message}`);
          return [];
        }),
      // Calculate net worth
      calculateNetWorth(userId).catch(error => {
        console.error(`[contextService:getContext] Error calculating net worth: ${error.message}`);
        return { total: 0, liquid: 0 };
      })
    ]);

    // Fetch placeholder data for recurring transactions and upcoming bills
    const [recurringTransactions, upcomingBills] = await Promise.all([
      findRecurringTransactionsAndDueDates(userId, now, thirtyDaysLater).catch(error => {
        console.error(`[contextService:getContext] Error finding recurring transactions: ${error.message}`);
        return [];
      }),
      findUpcomingBills(userId, now, thirtyDaysLater).catch(error => {
        console.error(`[contextService:getContext] Error finding upcoming bills: ${error.message}`);
        return [];
      })
    ]);

    if (isDev) {
      console.log(`[contextService:getContext] Fetched data - wallets: ${wallets.length}, transactions: ${recentTransactions.length}, ` +
        `budgets: ${budgets.length}, savings goals: ${savingsGoals.length}, categories: ${categories.length}, ` +
        `savings accounts: ${savingsAccounts.length}, monthly transactions: ${monthlyTx.length}`);
    }
    
    // Calculate total balance
    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    // Calculate monthly summary
    let monthlyExpenses = 0, monthlyIncome = 0, savingsRate = 0;
    
    monthlyExpenses = monthlyTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amountDecrypted || 0), 0);
    monthlyIncome = monthlyTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amountDecrypted || 0), 0);
    savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;
    
    if (isDev) {
      console.log(`[contextService:getContext] Monthly stats - expenses: $${monthlyExpenses}, income: $${monthlyIncome}, savings rate: ${savingsRate.toFixed(1)}%`);
    }
    
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
      financialSummary: { monthlyExpenses, monthlyIncome, savingsRate, netWorth }
    };

    // Cache the context for 5 minutes
    await cacheUtil.set(cacheKey, context, 300);
    if (isDev) console.log(`[contextService:getContext] Cached context for user ${userId}`);
    
    return context;
  } catch (error) {
    console.error(`[contextService:getContext] Error fetching context: ${error.message}`);
    console.error(error.stack);
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

// All formatting functions have been moved to the contextFormatter module

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
  getContext, 
  formatContext, 
  generateContextSuggestions 
};

