const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Category = require('../models/Category');

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
  switch (type) {
    case 'balance':
      return [
        `Total Balance: $${ctx.totalBalance}`,
        ...ctx.wallets.map(w => `- ${w.name}: $${w.balance} (${w.type})`)
      ].join('\n');
    case 'budget':
      // Enhanced budget prompt with detailed expense breakdown
      let prompt = '\nHere is your financial overview:\n\n';
      
      // Budget section
      prompt += '## BUDGET INFORMATION\n';
      if (ctx.budgets && ctx.budgets.length > 0) {
        prompt += 'Your current budget allocations:\n';
        ctx.budgets.forEach(budget => {
          const catName = budget.category?.name || 'Uncategorized';
          // Use pre-calculated budget usage from controller
          const spent = budget.spent || 0;
          const remaining = budget.remaining || budget.amount;
          const percentUsed = budget.percentUsed || 0;
          
          prompt += `- ${budget.name} (${catName}): $${spent.toFixed(2)}/$${budget.amount} (${percentUsed.toFixed(0)}% used, $${remaining.toFixed(2)} remaining)\n`;
        });
      } else {
        prompt += 'You have not set up any budgets yet.\n';
      }
      
      // Add expense breakdown by category
      prompt += '\n## EXPENSE BREAKDOWN\n';
      
      // Map to track spending by category
      const categorySpending = {};
      
      // Process all transactions marked as expenses
      if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
        const expenseTransactions = ctx.recentTransactions.filter(t => t.type === 'expense');
        
        if (expenseTransactions.length > 0) {
          // Categorize spending
          expenseTransactions.forEach(transaction => {
            const categoryName = transaction.category?.name || 'Uncategorized';
            if (!categorySpending[categoryName]) {
              categorySpending[categoryName] = {
                total: 0,
                transactions: []
              };
            }
            
            const amount = Math.abs(transaction.amount);
            categorySpending[categoryName].total += amount;
            categorySpending[categoryName].transactions.push({
              description: transaction.description || 'No description',
              amount: amount,
              date: transaction.date
            });
          });
          
          // Add category spending to prompt
          prompt += 'Your spending by category:\n';
          Object.entries(categorySpending).forEach(([category, data]) => {
            prompt += `- ${category}: $${data.total.toFixed(2)}\n`;
            
            // List up to 3 most recent transactions in each category
            prompt += '  Recent transactions:\n';
            data.transactions.slice(0, 3).forEach(t => {
              const date = new Date(t.date).toLocaleDateString();
              prompt += `  • ${t.description}: $${t.amount.toFixed(2)} on ${date}\n`;
            });
          });
          
          // Calculate total expenses
          const totalExpenses = Object.values(categorySpending).reduce((sum, cat) => sum + cat.total, 0);
          prompt += `\nTotal expenses: $${totalExpenses.toFixed(2)}\n`;
        } else {
          prompt += 'No expense transactions found in your recent history.\n';
        }
      } else {
        prompt += 'No transaction history available to analyze expenses.\n';
      }
      
      // Income vs. Expenses
      prompt += '\n## INCOME VS. EXPENSES\n';
      prompt += `Monthly income: $${ctx.financialSummary.monthlyIncome}\n`;
      prompt += `Monthly expenses: $${ctx.financialSummary.monthlyExpenses}\n`;
      
      if (ctx.financialSummary.monthlyIncome > 0) {
        const surplus = ctx.financialSummary.monthlyIncome - ctx.financialSummary.monthlyExpenses;
        prompt += `Monthly ${surplus >= 0 ? 'surplus' : 'deficit'}: $${Math.abs(surplus).toFixed(2)}\n`;
      }
      
      // Wallets overview
      prompt += '\n## WALLET BALANCES\n';
      if (ctx.wallets && ctx.wallets.length > 0) {
        ctx.wallets.forEach(wallet => {
          prompt += `- ${wallet.name} (${wallet.type}): $${wallet.balance.toFixed(2)}\n`;
        });
        prompt += `Total balance across all accounts: $${ctx.totalBalance.toFixed(2)}\n`;
      } else {
        prompt += 'No wallet accounts found.\n';
      }
      
      // Add user guidance
      prompt += `\nThe user has asked about their budgets and expenses. Please provide a helpful response focusing on:\n`;
      prompt += `1. Their budget status, highlighting any that are close to or exceeding limits\n`;
      prompt += `2. A breakdown of their actual spending by category\n`;
      prompt += `3. Suggestions for managing expenses based on their current financial situation\n`;
      
      return prompt;
    
    case 'savings':
      let savingsPrompt = '## SAVINGS GOALS\n\n';
      
      if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
        savingsPrompt += 'Here are your current savings goals:\n\n';
        
        ctx.savingsGoals.forEach(goal => {
          // Format the goal details
          savingsPrompt += `- **${goal.name}**: $${goal.current.toFixed(2)}/$${goal.target.toFixed(2)} (${goal.progress}% complete)\n`;
          
          // Add deadline info if available
          if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const timeLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)); // days left
            
            savingsPrompt += `  • Deadline: ${deadline.toLocaleDateString()} (${timeLeft} days remaining)\n`;
            
            // Calculate required monthly contribution
            if (goal.timeRemaining && goal.monthlyNeeded) {
              savingsPrompt += `  • Monthly contribution needed: $${goal.monthlyNeeded.toFixed(2)}\n`;
            }
          }
          
          // Add description if available
          if (goal.description) {
            savingsPrompt += `  • Notes: ${goal.description}\n`;
          }
          
          savingsPrompt += '\n';
        });
        
        // Add suggestions
        savingsPrompt += `\n### Suggestions:\n`;
        savingsPrompt += `- Review your progress and consider adjusting monthly contributions if needed.\n`;
        savingsPrompt += `- You might want to prioritize goals with approaching deadlines.\n`;
      } else {
        savingsPrompt += 'You have not set up any savings goals yet.\n\n';
        savingsPrompt += 'Setting savings goals can help you stay on track with your financial priorities. Consider creating goals for:\n';
        savingsPrompt += '- Emergency fund (3-6 months of expenses)\n';
        savingsPrompt += '- Major purchases\n';
        savingsPrompt += '- Retirement contributions\n';
      }
      
      return savingsPrompt;
    case 'bills':
      return [
        'Upcoming Bills:',
        ...ctx.upcomingBills.map(b => `- ${b.description || b.category}: $${b.amount} due in ${b.daysUntilDue} days`)
      ].join('\n');
    default:
      // For 'full' type, create a structured comprehensive prompt
      let fullPrompt = '\nHere is your complete financial overview:\n\n';
      
      // WALLET & BALANCE SECTION
      fullPrompt += '## ACCOUNTS & BALANCES\n';
      if (ctx.wallets && ctx.wallets.length > 0) {
        ctx.wallets.forEach(wallet => {
          fullPrompt += `- ${wallet.name} (${wallet.type}): $${wallet.balance.toFixed(2)}\n`;
        });
        fullPrompt += `Total balance: $${ctx.totalBalance.toFixed(2)}\n`;
      } else {
        fullPrompt += 'No accounts have been set up yet.\n';
      }
      
      // BUDGET SECTION
      fullPrompt += '\n## BUDGETS\n';
      if (ctx.budgets && ctx.budgets.length > 0) {
        ctx.budgets.forEach(budget => {
          const catName = budget.category?.name || 'Uncategorized';
          const spent = budget.spent || 0;
          const remaining = budget.remaining || budget.amount;
          const percentUsed = budget.percentUsed || 0;
          
          fullPrompt += `- ${budget.name} (${catName}): $${spent.toFixed(2)}/$${budget.amount} (${percentUsed.toFixed(0)}% used, $${remaining.toFixed(2)} remaining)\n`;
        });
      } else {
        fullPrompt += 'No budgets have been set up yet.\n';
      }
      
      // EXPENSE BREAKDOWN
      fullPrompt += '\n## RECENT EXPENSES\n';
      if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
        const expenses = ctx.recentTransactions.filter(t => t.type === 'expense');
        if (expenses.length > 0) {
          // Group by category
          const expensesByCategory = {};
          expenses.forEach(expense => {
            const category = expense.category?.name || 'Uncategorized';
            if (!expensesByCategory[category]) {
              expensesByCategory[category] = [];
            }
            expensesByCategory[category].push(expense);
          });
          
          Object.entries(expensesByCategory).forEach(([category, transactions]) => {
            const totalForCategory = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            fullPrompt += `- ${category}: $${totalForCategory.toFixed(2)}\n`;
            // List a few examples
            transactions.slice(0, 2).forEach(t => {
              fullPrompt += `  • ${t.description || 'No description'}: $${Math.abs(t.amount).toFixed(2)} on ${new Date(t.date).toLocaleDateString()}\n`;
            });
          });
          
          const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          fullPrompt += `\nTotal recent expenses: $${totalExpenses.toFixed(2)}\n`;
        } else {
          fullPrompt += 'No expense transactions found in your recent history.\n';
        }
      } else {
        fullPrompt += 'No transaction data available.\n';
      }
      
      // SAVINGS SECTION
      fullPrompt += '\n## SAVINGS GOALS\n';
      if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
        ctx.savingsGoals.forEach(goal => {
          // Format the goal details with better styling
          fullPrompt += `- **${goal.name}**: $${goal.current.toFixed(2)}/$${goal.target.toFixed(2)} (${goal.progress}% complete)\n`;
          
          // Add deadline info if available
          if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const timeLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)); // days left
            
            fullPrompt += `  • Deadline: ${deadline.toLocaleDateString()} (${timeLeft} days remaining)\n`;
          }
          
          // Add monthly contribution needed
          if (goal.timeRemaining) {
            fullPrompt += `  • Time remaining: ${goal.timeRemaining} months\n`;
            fullPrompt += `  • Required monthly contribution: $${goal.monthlyNeeded?.toFixed(2)}/month\n`;
          }
          
          // Add description if available
          if (goal.description) {
            fullPrompt += `  • Notes: ${goal.description}\n`;
          }
          
          fullPrompt += '\n';
        });
      } else {
        fullPrompt += 'No savings goals have been set up yet.\n\n';
        fullPrompt += 'Setting savings goals can help you stay on track with your financial priorities. Consider creating goals for:\n';
        fullPrompt += '- Emergency fund (3-6 months of expenses)\n';
        fullPrompt += '- Major purchases\n';
        fullPrompt += '- Retirement contributions\n';
      }
      
      // MONTHLY SUMMARY
      fullPrompt += '\n## MONTHLY SUMMARY\n';
      fullPrompt += `Monthly income: $${ctx.financialSummary.monthlyIncome}\n`;
      fullPrompt += `Monthly expenses: $${ctx.financialSummary.monthlyExpenses}\n`;
      fullPrompt += `Savings rate: ${ctx.financialSummary.savingsRate.toFixed(1)}%\n`;
      
      // NET WORTH
      fullPrompt += '\n## NET WORTH\n';
      fullPrompt += `Total net worth: $${ctx.netWorth.total}\n`;
      fullPrompt += `Liquid assets: $${ctx.netWorth.liquid}\n`;
      
      // GUIDANCE INSTRUCTIONS
      fullPrompt += `\nProvide a helpful response that gives the user a clear picture of their financial situation. `;
      fullPrompt += `Focus on the areas they ask about, but also highlight any important insights or areas of concern. `;
      fullPrompt += `Offer practical suggestions for improving their financial health based on the data provided.`;
      
      return fullPrompt;
  }
}

/**
 * Generate context-based suggestions.
 * @param {Object} ctx
 */
async function generateContextSuggestions(ctx) {
  // Placeholder suggestions
  return {
    generalAdvice: [
      "Consider reviewing your monthly subscriptions to cut down on recurring costs.",
      `Your savings rate is ${ctx.financialSummary.savingsRate.toFixed(1)}%. Aim for 20% for better financial health.`
    ]
  };
}

module.exports = { getContext, formatContext, generateContextSuggestions };
