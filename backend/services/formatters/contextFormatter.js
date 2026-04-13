/**
 * Context Formatter Service
 * 
 * Handles all formatting of financial context data into text prompts for AI.
 * This module is separated from the main context service for better organization
 * and performance optimization.
 */
const logger = require('../../utils/logger');
const { performance } = require('perf_hooks');

// Configuration for prompt optimization
const CONFIG = {
  // Limits for each section to control prompt length
  sectionLimits: {
    transactions: 5,           // Max number of transactions per type
    budgets: 10,               // Max number of budgets to include
    savingsGoals: 5,           // Max number of savings goals
    upcomingBills: 5,          // Max number of upcoming bills
    wallets: 10,               // Max number of wallets/accounts
  },
  // Complexity levels for dynamic adjustment
  complexityLevels: {
    basic: { detail: 0.5, maxLength: 1000 },
    standard: { detail: 1.0, maxLength: 2000 },
    detailed: { detail: 1.5, maxLength: 3000 }
  },
  // Standardized prompt templates
  templates: {
    header: 'Here is your financial overview:',
    instructions: [
      'Provide a helpful response that gives the user a clear picture of their financial situation.',
      'Focus on the areas they ask about, but also highlight any important insights or areas of concern.',
      'Offer practical suggestions for improving their financial health based on the data provided.'
    ]
  }
};

// Create a reusable date formatter for consistent formatting
const dateFormatter = new Intl.DateTimeFormat('en-US', { 
  year: 'numeric', 
  month: 'numeric', 
  day: 'numeric' 
});

/**
 * Formats context into a text prompt for the AI with optimized length and dynamic complexity.
 * @param {Object} ctx - The context object containing financial data
 * @param {String} type - 'balance'|'budget'|'savings'|'bills'|'full'
 * @param {String} complexity - 'basic'|'standard'|'detailed' - Controls detail level and prompt length
 * @returns {String} - Formatted text prompt
 */
function formatContext(ctx, type = 'full', complexity = 'standard') {
  const t0 = performance.now();
  const lines = [CONFIG.templates.header];
  
  // Get complexity settings
  const complexitySettings = CONFIG.complexityLevels[complexity] || CONFIG.complexityLevels.standard;
  
  // Calculate dynamic limits based on complexity
  const limits = calculateDynamicLimits(complexitySettings.detail);
  
  switch (type) {
    case 'balance':
      formatBalanceSection(ctx, lines, limits);
      formatTransactionsSection(ctx, lines, limits);
      break;
    case 'budget':
      formatBudgetSection(ctx, lines, limits);
      break;
    case 'savings':
      formatSavingsGoalsSection(ctx, lines, limits);
      break;
    case 'bills':
      formatBillsSection(ctx, lines, limits);
      break;
    default: // 'full'
      formatBalanceSection(ctx, lines, limits);
      formatBudgetSection(ctx, lines, limits);
      formatTransactionsSection(ctx, lines, limits);
      formatBillsSection(ctx, lines, limits);
      formatSavingsGoalsSection(ctx, lines, limits);
      break;
  }
  
  // Always include financial summary
  formatFinancialSummarySection(ctx, lines);
  
  // Add net worth if available
  if (ctx.netWorth && (ctx.netWorth.total || ctx.netWorth.liquid)) {
    formatNetWorthSection(ctx, lines);
  }
  
  // Add guidance instructions
  lines.push('');
  lines.push(...CONFIG.templates.instructions);
  
  // Build the result and check length
  let result = lines.join('\n');
  
  // If result exceeds max length for complexity level, trim sections
  if (result.length > complexitySettings.maxLength) {
    result = trimPromptToLength(result, complexitySettings.maxLength);
  }
  
  logPerformance('formatContext', t0, complexity);
  return result;
}

function logPerformance(operation, startTime, complexity = 'medium') {
  const duration = performance.now() - startTime;
  logger.performance(`Context formatter ${operation}`, duration, { complexity });
}

/**
 * Calculate dynamic limits based on complexity level
 * @param {Number} detailMultiplier - Multiplier for detail level (0.5 to 1.5)
 * @returns {Object} - Dynamic limits for each section
 */
function calculateDynamicLimits(detailMultiplier) {
  return Object.entries(CONFIG.sectionLimits).reduce((acc, [key, limit]) => {
    acc[key] = Math.max(1, Math.round(limit * detailMultiplier));
    return acc;
  }, {});
}

/**
 * Trim prompt to specified length while preserving important information
 * @param {String} prompt - The prompt to trim
 * @param {Number} maxLength - Maximum allowed length
 * @returns {String} - Trimmed prompt
 */
function trimPromptToLength(prompt, maxLength) {
  if (prompt.length <= maxLength) return prompt;
  
  // Split into sections
  const sections = prompt.split('\n\n');
  const importantSections = [0]; // Keep header
  
  // Identify important sections to keep
  sections.forEach((section, index) => {
    if (section.includes('FINANCIAL SUMMARY') || section.includes('NET WORTH')) {
      importantSections.push(index);
    }
  });
  
  // Build trimmed prompt
  const trimmedSections = sections.filter((_, index) => importantSections.includes(index));
  
  // Add back some other sections if space allows
  const remainingSpace = maxLength - trimmedSections.join('\n\n').length - 100; // 100 buffer
  
  if (remainingSpace > 0) {
    sections.forEach((section, index) => {
      if (!importantSections.includes(index) && section.length < remainingSpace) {
        trimmedSections.push(section);
      }
    });
  }
  
  const result = trimmedSections.join('\n\n');
  return result.length > maxLength ? result.substring(0, maxLength - 3) + '...' : result;
}

/**
 * Format the balance section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} limits - Dynamic limits for section length
 */
function formatBalanceSection(ctx, lines, limits) {
  lines.push('', '## ACCOUNTS & BALANCES');
  
  if (ctx.wallets && ctx.wallets.length > 0) {
    const limitedWallets = ctx.wallets.slice(0, limits.wallets);
    limitedWallets.forEach(wallet => {
      let line = `- ${wallet.name}: $${wallet.balance.toFixed(2)}`;
      if (wallet.type) {
        line += ` (${wallet.type})`;
      }
      lines.push(line);
    });
    
    if (ctx.wallets.length > limits.wallets) {
      lines.push(`... and ${ctx.wallets.length - limits.wallets} more accounts`);
    }
  } else {
    lines.push('No accounts found.');
  }
}

/**
 * Format the budget section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} limits - Dynamic limits for section length
 */
function formatBudgetSection(ctx, lines, limits) {
  lines.push('', '## BUDGETS');
  
  if (ctx.budgets && ctx.budgets.length > 0) {
    // Sort budgets by percent used to prioritize important ones
    const sortedBudgets = [...ctx.budgets].sort((a, b) => {
      const percentA = a.amount > 0 ? (a.spent || 0) / a.amount : 0;
      const percentB = b.amount > 0 ? (b.spent || 0) / b.amount : 0;
      return percentB - percentA;
    });
    
    const limitedBudgets = sortedBudgets.slice(0, limits.budgets);
    limitedBudgets.forEach(budget => {
      const categoryName = budget.category?.name || 'Uncategorized';
      const spent = budget.spent || 0;
      const remaining = Math.max(0, budget.amount - spent);
      const percentUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      
      let budgetLine = `- ${categoryName}: $${spent.toFixed(2)}/$${budget.amount.toFixed(2)} (${percentUsed}% used)`;
      if (percentUsed > 90) {
        budgetLine += ' ⚠️';
      }
      lines.push(budgetLine);
      lines.push(`  • Remaining: $${remaining.toFixed(2)}`);
    });
    
    if (ctx.budgets.length > limits.budgets) {
      lines.push(`... and ${ctx.budgets.length - limits.budgets} more budgets`);
    }
  } else {
    lines.push('No budgets have been set up yet.');
  }
}

/**
 * Format the transactions section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} limits - Dynamic limits for section length
 */
function formatTransactionsSection(ctx, lines, limits) {
  lines.push('', '## RECENT TRANSACTIONS');
  
  if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
    // Income transactions
    lines.push('### Income');
    const income = ctx.recentTransactions.filter(t => t.type === 'income');
    
    if (income.length > 0) {
      const limitedIncome = income.slice(0, limits.transactions);
      limitedIncome.forEach(t => {
        const date = dateFormatter.format(new Date(t.date));
        const catName = t.category?.name || 'Uncategorized';
        lines.push(`- ${t.description || 'No description'} ($${t.amount.toFixed(2)}) - ${catName} on ${date}`);
      });
      
      if (income.length > limits.transactions) {
        lines.push(`... and ${income.length - limits.transactions} more income transactions`);
      }
    } else {
      lines.push('No income transactions found in your recent history.');
    }
    
    // Expense transactions
    lines.push('### Expenses');
    const expenses = ctx.recentTransactions.filter(t => t.type === 'expense');
    
    if (expenses.length > 0) {
      // Sort expenses by amount (descending) to show largest first
      const sortedExpenses = [...expenses].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      const limitedExpenses = sortedExpenses.slice(0, limits.transactions);
      
      limitedExpenses.forEach(t => {
        const date = dateFormatter.format(new Date(t.date));
        const catName = t.category?.name || 'Uncategorized';
        lines.push(`- ${t.description || 'No description'} ($${Math.abs(t.amount).toFixed(2)}) - ${catName} on ${date}`);
      });
      
      if (expenses.length > limits.transactions) {
        lines.push(`... and ${expenses.length - limits.transactions} more expense transactions`);
      }
    } else {
      lines.push('No expense transactions found in your recent history.');
    }
  } else {
    lines.push('No transaction history available.');
  }
}

/**
 * Format the bills section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} limits - Dynamic limits for section length
 */
function formatBillsSection(ctx, lines, limits) {
  if (ctx.upcomingBills && ctx.upcomingBills.length > 0) {
    lines.push('', '## UPCOMING BILLS');
    
    // Sort bills by days until due (ascending) to show urgent ones first
    const sortedBills = [...ctx.upcomingBills].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    const limitedBills = sortedBills.slice(0, limits.upcomingBills);
    
    limitedBills.forEach(bill => {
      lines.push(`- ${bill.description || bill.category}: $${bill.amount.toFixed(2)} due in ${bill.daysUntilDue} days`);
    });
    
    if (ctx.upcomingBills.length > limits.upcomingBills) {
      lines.push(`... and ${ctx.upcomingBills.length - limits.upcomingBills} more upcoming bills`);
    }
  }
}

/**
 * Format the savings goals section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} limits - Dynamic limits for section length
 */
function formatSavingsGoalsSection(ctx, lines, limits) {
  lines.push('', '## SAVINGS GOALS');
  
  if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
    // Sort goals by progress (ascending) to show least complete first
    const sortedGoals = [...ctx.savingsGoals].sort((a, b) => a.progress - b.progress);
    const limitedGoals = sortedGoals.slice(0, limits.savingsGoals);
    
    limitedGoals.forEach(goal => {
      lines.push(`- ${goal.name}: $${goal.current.toFixed(2)}/$${goal.target.toFixed(2)} (${goal.progress}% complete)`);
      
      if (goal.deadline) {
        const deadline = dateFormatter.format(new Date(goal.deadline));
        lines.push(`  • Target date: ${deadline}`);
      }
      
      // Add monthly contribution needed
      if (goal.timeRemaining) {
        lines.push(`  • Time remaining: ${goal.timeRemaining} months`);
        lines.push(`  • Required monthly contribution: $${goal.monthlyNeeded?.toFixed(2)}/month`);
      }
      
      // Add description if available
      if (goal.description) {
        // Truncate long descriptions
        const truncatedDesc = goal.description.length > 50 ? goal.description.substring(0, 50) + '...' : goal.description;
        lines.push(`  • Notes: ${truncatedDesc}`);
      }
    });
    
    if (ctx.savingsGoals.length > limits.savingsGoals) {
      lines.push(`... and ${ctx.savingsGoals.length - limits.savingsGoals} more savings goals`);
    }
  } else {
    lines.push('No savings goals have been set up yet.');
  }
}

/**
 * Format the financial summary section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatFinancialSummarySection(ctx, lines) {
  lines.push('', '## FINANCIAL SUMMARY');
  lines.push(`Monthly income: $${ctx.financialSummary.monthlyIncome.toFixed(2)}`);
  lines.push(`Monthly expenses: $${ctx.financialSummary.monthlyExpenses.toFixed(2)}`);
  
  if (ctx.financialSummary.savingsRate) {
    lines.push(`Savings rate: ${ctx.financialSummary.savingsRate.toFixed(1)}%`);
  }
}

/**
 * Format the net worth section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatNetWorthSection(ctx, lines) {
  lines.push('', '## NET WORTH');
  lines.push(`Total net worth: $${ctx.netWorth.total.toFixed(2)}`);
  lines.push(`Liquid assets: $${ctx.netWorth.liquid.toFixed(2)}`);
}

/**
 * Generate suggestions based on the user's financial context
 * @param {Object} ctx - The context object
 * @returns {Object} - Object containing suggestions
 */
function generateContextSuggestions(ctx) {
  // Placeholder suggestions
  return {
    generalAdvice: [
      "Consider reviewing your monthly subscriptions to cut down on recurring costs.",
      `Your savings rate is ${ctx.financialSummary.savingsRate.toFixed(1)}%. Aim for 20% for better financial health.`
    ]
  };
}

module.exports = {
  formatContext,
  generateContextSuggestions,
  formatBalanceSection,
  formatBudgetSection,
  formatTransactionsSection,
  formatBillsSection,
  formatSavingsGoalsSection,
  formatFinancialSummarySection,
  formatNetWorthSection
};
