const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Category = require('../models/Category');
const { performance } = require('perf_hooks');
const contextFormatter = require('./formatters/contextFormatter');

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
  console.log(`[contextService:getContext] Fetching context for user ${userId}`);
  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);

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

    // Check if user exists
    try {
      const User = require('../models/User');
      const userExists = await User.findById(userId);
      if (!userExists) {
        console.error(`[contextService:getContext] ERROR: User with ID ${userId} not found in database`);
      } else {
        console.log(`[contextService:getContext] User found: ${userExists.email || 'No email'}`);
      }
    } catch (userError) {
      console.error(`[contextService:getContext] ERROR checking user: ${userError.message}`);
    }

    // Explicitly fetch budgets first to ensure they are loaded
    console.log(`[contextService:getContext] Explicitly fetching budgets for user ${userId}`);
    const budgetsQuery = Budget.find({ userId });
    const rawBudgetCount = await budgetsQuery.clone().countDocuments();
    console.log(`[contextService:getContext] Raw budget count in DB: ${rawBudgetCount}`);
    
    // Verify MongoDB connection
    try {
      const mongoose = require('mongoose');
      const connectionState = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.log(`[contextService:getContext] MongoDB connection state: ${states[connectionState] || connectionState}`);
    } catch (mongoError) {
      console.error(`[contextService:getContext] Error checking MongoDB connection: ${mongoError.message}`);
    }
    
    // Try different approaches to ensure we get budget data
    let budgets = [];
    
    if (rawBudgetCount > 0) {
      // Try with populate
      budgets = await budgetsQuery.clone().populate('category', 'name');
      console.log(`[contextService:getContext] Fetched ${budgets.length} budgets with populated categories`);
      
      // If no budgets or failed population, try without populate
      if (!budgets || budgets.length === 0) {
        budgets = await Budget.find({ userId }).lean();
        console.log(`[contextService:getContext] Fallback: fetched ${budgets.length} budgets with lean()`);
      }
      
      // Log first budget for debugging
      if (budgets.length > 0) {
        console.log(`[contextService:getContext] First budget sample:`, JSON.stringify(budgets[0]));
      }
    } else {
      // Try direct debug query
      console.log(`[contextService:getContext] No budgets found with userId match. Trying alternative query...`);
      try {
        // Check if ID format might be the issue (ObjectId vs String)
        const allBudgets = await Budget.find({}).limit(5).lean();
        console.log(`[contextService:getContext] Sample of all budgets (${allBudgets.length} found):`, 
          allBudgets.length > 0 ? 
            JSON.stringify(allBudgets.map(b => ({ id: b._id, userId: b.userId }))) : 
            'No budgets in database');
            
        if (allBudgets.length > 0) {
          // Check if userId formats match
          console.log(`[contextService:getContext] Sample budget userId type: ${typeof allBudgets[0].userId}`);
          console.log(`[contextService:getContext] Request userId type: ${typeof userId}`);
          
          // Try to match by string comparison if ObjectId doesn't match
          const matchingBudget = allBudgets.find(b => b.userId.toString() === userId.toString());
          if (matchingBudget) {
            console.log(`[contextService:getContext] Found budget with string comparison, userId format issue confirmed`);
          }
        }
      } catch (alternativeError) {
        console.error(`[contextService:getContext] Alternative query error: ${alternativeError.message}`);
      }
    }

    // Fetch the rest of the data
    console.log(`[contextService:getContext] Fetching additional financial data`);
    let wallets = [], recentTransactions = [], savingsGoals = [], 
        categories = [], netWorth = { total: 0, liquid: 0 }, 
        recurringTransactions = [], upcomingBills = [], savingsAccounts = [];
        
    try {
      wallets = await Wallet.find({ userId });
      console.log(`[contextService:getContext] Fetched ${wallets.length} wallets`);
    } catch (error) {
      console.error(`[contextService:getContext] Error fetching wallets: ${error.message}`);
    }
    
    try {
      recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(10)
        .populate('category', 'name');
      console.log(`[contextService:getContext] Fetched ${recentTransactions.length} transactions`);
    } catch (error) {
      console.error(`[contextService:getContext] Error fetching transactions: ${error.message}`);
    }
    
    try {
      savingsGoals = await SavingsGoal.find({ userId });
      console.log(`[contextService:getContext] Fetched ${savingsGoals.length} savings goals`);
    } catch (error) {
      console.error(`[contextService:getContext] Error fetching savings goals: ${error.message}`);
    }
    
    try {
      categories = await Category.find({ userId });
      console.log(`[contextService:getContext] Fetched ${categories.length} categories`);
    } catch (error) {
      console.error(`[contextService:getContext] Error fetching categories: ${error.message}`);
    }
    
    try {
      netWorth = await calculateNetWorth(userId);
      console.log(`[contextService:getContext] Calculated net worth: ${JSON.stringify(netWorth)}`);
    } catch (error) {
      console.error(`[contextService:getContext] Error calculating net worth: ${error.message}`);
    }
    
    try {
      recurringTransactions = await findRecurringTransactionsAndDueDates(userId, now, thirtyDaysLater);
      console.log(`[contextService:getContext] Found ${recurringTransactions.length} recurring transactions`);
    } catch (error) {
      console.error(`[contextService:getContext] Error finding recurring transactions: ${error.message}`);
    }
    
    try {
      upcomingBills = await findUpcomingBills(userId, now, thirtyDaysLater);
      console.log(`[contextService:getContext] Found ${upcomingBills.length} upcoming bills`);
    } catch (error) {
      console.error(`[contextService:getContext] Error finding upcoming bills: ${error.message}`);
    }
    
    try {
      savingsAccounts = await SavingsAccount.find({ userId }).lean();
      console.log(`[contextService:getContext] Fetched ${savingsAccounts.length} savings accounts`);
    } catch (error) {
      console.error(`[contextService:getContext] Error fetching savings accounts: ${error.message}`);
    }

    console.log(`[contextService:getContext] Fetched wallets: ${wallets.length}, transactions: ${recentTransactions.length}, categories: ${categories.length}`);
    
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Monthly summary
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthlyExpenses = 0, monthlyIncome = 0, savingsRate = 0;
    
    try {
    const monthlyTx = await Transaction.find({ userId, date: { $gte: firstOfMonth } });
      console.log(`[contextService:getContext] Found ${monthlyTx.length} transactions for current month`);
      
      monthlyExpenses = monthlyTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      monthlyIncome = monthlyTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;
    } catch (error) {
      console.error(`[contextService:getContext] Error calculating monthly summary: ${error.message}`);
    }
    
    console.log(`[contextService:getContext] Monthly stats - expenses: $${monthlyExpenses}, income: $${monthlyIncome}, savings rate: ${savingsRate.toFixed(1)}%`);
    
    return {
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
