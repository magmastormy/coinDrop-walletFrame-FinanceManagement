/**
 * Context Formatter Service
 * 
 * Handles all formatting of financial context data into text prompts for AI.
 * This module is separated from the main context service for better organization
 * and performance optimization.
 */
const { performance } = require('perf_hooks');

// Create a reusable date formatter for consistent formatting
const dateFormatter = new Intl.DateTimeFormat('en-US', { 
  year: 'numeric', 
  month: 'numeric', 
  day: 'numeric' 
});

/**
 * Formats context into a text prompt for the AI.
 * @param {Object} ctx - The context object containing financial data
 * @param {String} type - 'balance'|'budget'|'savings'|'bills'|'full'
 * @returns {String} - Formatted text prompt
 */
function formatContext(ctx, type = 'full') {
  const t0 = performance.now();
  // Use array joining instead of string concatenation for better performance
  const lines = ['Here is your financial overview:'];
  
  switch (type) {
    case 'balance':
      formatBalanceSection(ctx, lines);
      formatTransactionsSection(ctx, lines);
      break;
    case 'budget':
      formatBudgetSection(ctx, lines);
      break;
    case 'savings':
      formatSavingsGoalsSection(ctx, lines);
      break;
    case 'bills':
      formatBillsSection(ctx, lines);
      break;
    default: // 'full'
      formatBalanceSection(ctx, lines);
      formatBudgetSection(ctx, lines);
      formatTransactionsSection(ctx, lines);
      formatBillsSection(ctx, lines);
      formatSavingsGoalsSection(ctx, lines);
      break;
  }
  
  // Always include financial summary
  formatFinancialSummarySection(ctx, lines);
  
  // Add net worth if available
  if (ctx.netWorth && (ctx.netWorth.total || ctx.netWorth.liquid)) {
    formatNetWorthSection(ctx, lines);
  }
  
  // Add guidance instructions
  lines.push('', 'Provide a helpful response that gives the user a clear picture of their financial situation.',
    'Focus on the areas they ask about, but also highlight any important insights or areas of concern.',
    'Offer practical suggestions for improving their financial health based on the data provided.');
  
  const result = lines.join('\n');
  console.log(`[formatContext] Built ${type} context in ${(performance.now() - t0).toFixed(1)}ms, length: ${result.length} chars`);
  return result;
}

/**
 * Format the balance section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatBalanceSection(ctx, lines) {
  lines.push('', '## ACCOUNTS & BALANCES');
  
  if (ctx.wallets && ctx.wallets.length > 0) {
    ctx.wallets.forEach(wallet => {
      let line = `- ${wallet.name}: $${wallet.balance.toFixed(2)}`;
      if (wallet.type) {
        line += ` (${wallet.type})`;
      }
      lines.push(line);
    });
  } else {
    lines.push('No accounts found.');
  }
}

/**
 * Format the budget section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatBudgetSection(ctx, lines) {
  lines.push('', '## BUDGETS');
  
  if (ctx.budgets && ctx.budgets.length > 0) {
    ctx.budgets.forEach(budget => {
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
  } else {
    lines.push('No budgets have been set up yet.');
  }
}

/**
 * Format the transactions section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatTransactionsSection(ctx, lines) {
  lines.push('', '## RECENT TRANSACTIONS');
  
  if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
    // Income transactions
    lines.push('### Income');
    const income = ctx.recentTransactions.filter(t => t.type === 'income');
    
    if (income.length > 0) {
      income.slice(0, 5).forEach(t => {
        const date = dateFormatter.format(new Date(t.date));
        const catName = t.category?.name || 'Uncategorized';
        lines.push(`- ${t.description || 'No description'} ($${t.amount.toFixed(2)}) - ${catName} on ${date}`);
      });
    } else {
      lines.push('No income transactions found in your recent history.');
    }
    
    // Expense transactions
    lines.push('### Expenses');
    const expenses = ctx.recentTransactions.filter(t => t.type === 'expense');
    
    if (expenses.length > 0) {
      expenses.slice(0, 5).forEach(t => {
        const date = dateFormatter.format(new Date(t.date));
        const catName = t.category?.name || 'Uncategorized';
        lines.push(`- ${t.description || 'No description'} ($${Math.abs(t.amount).toFixed(2)}) - ${catName} on ${date}`);
      });
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
 */
function formatBillsSection(ctx, lines) {
  if (ctx.upcomingBills && ctx.upcomingBills.length > 0) {
    lines.push('', '## UPCOMING BILLS');
    ctx.upcomingBills.forEach(bill => {
      lines.push(`- ${bill.description || bill.category}: $${bill.amount.toFixed(2)} due in ${bill.daysUntilDue} days`);
    });
  }
}

/**
 * Format the savings goals section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatSavingsGoalsSection(ctx, lines) {
  lines.push('', '## SAVINGS GOALS');
  
  if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
    ctx.savingsGoals.forEach(goal => {
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
        lines.push(`  • Notes: ${goal.description}`);
      }
    });
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
