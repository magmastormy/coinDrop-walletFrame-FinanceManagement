/**
 * Enhanced Context Formatter Service
 * 
 * Extends the base context formatter with more detailed transaction information
 * and better handling of multi-part questions.
 */
const { performance } = require('perf_hooks');
const baseFormatter = require('./contextFormatter');

// Create a reusable date formatter for consistent formatting
const dateFormatter = new Intl.DateTimeFormat('en-US', { 
  year: 'numeric', 
  month: 'numeric', 
  day: 'numeric' 
});

/**
 * Formats context into a text prompt for the AI with enhanced details
 * @param {Object} ctx - The context object containing financial data
 * @param {String} type - 'balance'|'budget'|'savings'|'bills'|'full'
 * @param {Object} questionAnalysis - Analysis of the user's question
 * @returns {String} - Formatted text prompt
 */
function formatEnhancedContext(ctx, type = 'full', questionAnalysis = null) {
  const t0 = performance.now();
  // Use array joining instead of string concatenation for better performance
  const lines = ['Here is your financial overview:'];
  
  // Check for specific data requests
  const showDetailedBudgets = questionAnalysis && questionAnalysis.specificDataRequests.specificBudget;
  const showDetailedSavings = questionAnalysis && questionAnalysis.specificDataRequests.savingsGoals;
  
  // Include standard sections based on type
  switch (type) {
    case 'balance':
      formatBalanceSection(ctx, lines);
      formatEnhancedTransactionsSection(ctx, lines, questionAnalysis);
      break;
    case 'budget':
      formatEnhancedBudgetSection(ctx, lines, questionAnalysis);
      // If asking about both budgets and savings, include savings section too
      if (showDetailedSavings) {
        formatSavingsGoalsSection(ctx, lines, questionAnalysis);
      }
      break;
    case 'savings':
      formatSavingsGoalsSection(ctx, lines, questionAnalysis);
      // If asking about both savings and budgets, include budget section too
      if (showDetailedBudgets) {
        formatEnhancedBudgetSection(ctx, lines, questionAnalysis);
      }
      break;
    case 'bills':
      formatBillsSection(ctx, lines);
      break;
    default: // 'full'
      formatBalanceSection(ctx, lines);
      formatEnhancedBudgetSection(ctx, lines, questionAnalysis);
      formatEnhancedTransactionsSection(ctx, lines, questionAnalysis);
      formatBillsSection(ctx, lines);
      formatSavingsGoalsSection(ctx, lines, questionAnalysis);
      break;
  }
  
  // Always include financial summary
  formatFinancialSummarySection(ctx, lines);
  
  // Add net worth if available
  if (ctx.netWorth && (ctx.netWorth.total || ctx.netWorth.liquid)) {
    formatNetWorthSection(ctx, lines);
  }
  
  // Add enhanced sections based on question analysis
  if (questionAnalysis) {
    addEnhancedSections(ctx, lines, questionAnalysis);
  }
  
  // Add guidance instructions
  lines.push('', 'Provide a helpful response that gives the user a clear picture of their financial situation.',
    'Focus on the areas they ask about, but also highlight any important insights or areas of concern.',
    'Offer practical suggestions for improving their financial health based on the data provided.',
    'If the user asks multiple questions, make sure to address each question separately and clearly.');
  
  const result = lines.join('\n');
  console.log(`[enhancedContextFormatter] Built ${type} context in ${(performance.now() - t0).toFixed(1)}ms, length: ${result.length} chars`);
  return result;
}

/**
 * Format the balance section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatBalanceSection(ctx, lines) {
  baseFormatter.formatBalanceSection(ctx, lines);
}

/**
 * Format the budget section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatBudgetSection(ctx, lines) {
  baseFormatter.formatBudgetSection(ctx, lines);
}

/**
 * Format an enhanced budget section with more details when specifically requested
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} questionAnalysis - Analysis of the user's question
 */
function formatEnhancedBudgetSection(ctx, lines, questionAnalysis = null) {
  lines.push('', '## BUDGETS');
  
  // Check if user specifically asked about budgets
  const showDetailedBudgets = questionAnalysis && questionAnalysis.specificDataRequests.specificBudget;
  
  if (ctx.budgets && ctx.budgets.length > 0) {
    // If specifically asking about budgets, provide more detailed information
    if (showDetailedBudgets) {
      lines.push(`You have ${ctx.budgets.length} budget${ctx.budgets.length > 1 ? 's' : ''}:`);
    }
    
    ctx.budgets.forEach(budget => {
      const categoryName = budget.category?.name || 'Uncategorized';
      const spent = budget.spent || 0;
      const remaining = Math.max(0, budget.amount - spent);
      const percentUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      
      let budgetLine = `- ${budget.name || categoryName}: $${spent.toFixed(2)}/$${budget.amount.toFixed(2)} (${percentUsed}% used)`;
      if (percentUsed > 90) {
        budgetLine += ' ⚠️';
      }
      lines.push(budgetLine);
      lines.push(`  • Remaining: $${remaining.toFixed(2)}`);
      
      // Add additional details for specific budget queries
      if (showDetailedBudgets) {
        if (budget.period) {
          lines.push(`  • Period: ${budget.period}`);
        }
        
        if (budget.startDate) {
          const startDate = dateFormatter.format(new Date(budget.startDate));
          lines.push(`  • Start date: ${startDate}`);
        }
        
        if (budget.walletId) {
          const wallet = ctx.wallets?.find(w => w._id === budget.walletId);
          if (wallet) {
            lines.push(`  • Linked wallet: ${wallet.name}`);
          }
        }
        
        // Show recent transactions for this budget if available
        if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
          const budgetTransactions = ctx.recentTransactions.filter(t => {
            // Match by category
            if (budget.category && t.category) {
              return t.category._id === budget.category._id;
            }
            return false;
          }).slice(0, 3);
          
          if (budgetTransactions.length > 0) {
            lines.push(`  • Recent transactions:`);
            budgetTransactions.forEach(t => {
              const date = dateFormatter.format(new Date(t.date));
              lines.push(`    - ${t.description || 'No description'}: $${Math.abs(t.amount).toFixed(2)} on ${date}`);
            });
          }
        }
        
        // Add spending trend if available
        if (budget.spendingTrend) {
          lines.push(`  • Spending trend: ${budget.spendingTrend}`);
        } else if (percentUsed > 80 && budget.period === 'monthly') {
          // Calculate days left in month
          const now = new Date();
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const daysLeft = lastDay - now.getDate();
          const daysInMonth = lastDay;
          const percentTimeLeft = Math.round((daysLeft / daysInMonth) * 100);
          
          if (percentTimeLeft > percentUsed) {
            lines.push(`  • Warning: You've used ${percentUsed}% of your budget with ${percentTimeLeft}% of the period remaining.`);
          }
        }
      }
    });
  } else {
    lines.push('No budgets have been set up yet.');
    if (showDetailedBudgets) {
      lines.push('Consider setting up budgets to help manage your spending and track your financial goals.');
    }
  }
}

/**
 * Format the bills section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatBillsSection(ctx, lines) {
  baseFormatter.formatBillsSection(ctx, lines);
}

/**
 * Format the savings goals section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatSavingsGoalsSection(ctx, lines, questionAnalysis = null) {
  lines.push('', '## SAVINGS GOALS');
  
  // Check if user specifically asked about savings goals
  const showDetailedSavings = questionAnalysis && questionAnalysis.specificDataRequests.savingsGoals;
  
  if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
    // If specifically asking about savings goals, provide more detailed information
    if (showDetailedSavings) {
      lines.push(`You have ${ctx.savingsGoals.length} savings goal${ctx.savingsGoals.length > 1 ? 's' : ''}:`);
    }
    
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
      
      // Add additional details for specific queries
      if (showDetailedSavings) {
        // Calculate monthly average contribution based on history if available
        if (goal.contributions && goal.contributions.length > 0) {
          const totalContributions = goal.contributions.reduce((sum, c) => sum + c.amount, 0);
          const avgMonthly = totalContributions / goal.contributions.length;
          lines.push(`  • Average monthly contribution: $${avgMonthly.toFixed(2)}/month`);
        }
        
        // Add estimated completion date if not already at 100%
        if (goal.progress < 100) {
          const remaining = goal.target - goal.current;
          const monthlyNeeded = goal.monthlyNeeded || 0;
          if (monthlyNeeded > 0) {
            const monthsToComplete = Math.ceil(remaining / monthlyNeeded);
            const completionDate = new Date();
            completionDate.setMonth(completionDate.getMonth() + monthsToComplete);
            lines.push(`  • Estimated completion date: ${dateFormatter.format(completionDate)} (in ${monthsToComplete} months)`);
          }
        }
      }
    });
  } else {
    lines.push('No savings goals have been set up yet.');
    if (showDetailedSavings) {
      lines.push('Consider setting up savings goals to help track your progress toward financial targets.');
    }
  }
}

/**
 * Format the financial summary section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatFinancialSummarySection(ctx, lines) {
  baseFormatter.formatFinancialSummarySection(ctx, lines);
}

/**
 * Format the net worth section of the context
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 */
function formatNetWorthSection(ctx, lines) {
  baseFormatter.formatNetWorthSection(ctx, lines);
}

/**
 * Format the transactions section with enhanced details
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} questionAnalysis - Analysis of the user's question
 */
function formatEnhancedTransactionsSection(ctx, lines, questionAnalysis) {
  lines.push('', '## RECENT TRANSACTIONS');
  
  if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
    // Sort transactions by date (newest first)
    const sortedTransactions = [...ctx.recentTransactions].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Determine how many transactions to show based on question analysis
    let transactionLimit = 5; // Default
    
    // Check if user specifically asked for transactions
    const showMoreTransactions = questionAnalysis && 
      (questionAnalysis.specificDataRequests.lastTransaction || 
       questionAnalysis.specificDataRequests.specificTransaction ||
       questionAnalysis.specificDataRequests.transactionByCategory);
       
    // Check if user mentioned a specific number of transactions
    if (questionAnalysis) {
      const numMatch = questionAnalysis.parts.join(' ').match(/\b(\d+)\s+transactions\b/i);
      if (numMatch && numMatch[1]) {
        const requestedNum = parseInt(numMatch[1], 10);
        if (!isNaN(requestedNum) && requestedNum > 0) {
          transactionLimit = Math.min(requestedNum, 20); // Cap at 20 to avoid overwhelming
          console.log(`[enhancedContextFormatter] User requested ${transactionLimit} transactions`);
        }
      }
    }
    
    // If specifically asking about transactions, show more
    if (showMoreTransactions) {
      transactionLimit = Math.min(10, sortedTransactions.length);
    }
    
    // Add the most recent transaction with full details
    const mostRecent = sortedTransactions[0];
    lines.push('### Most Recent Transaction');
    lines.push(`- Description: ${mostRecent.description || 'No description'}`);
    lines.push(`- Amount: $${Math.abs(mostRecent.amount).toFixed(2)}`);
    lines.push(`- Type: ${mostRecent.type || 'Unknown'}`);
    lines.push(`- Category: ${mostRecent.category?.name || 'Uncategorized'}`);
    lines.push(`- Date: ${dateFormatter.format(new Date(mostRecent.date))}`);
    if (mostRecent.walletId) {
      const wallet = ctx.wallets?.find(w => w._id === mostRecent.walletId);
      if (wallet) {
        lines.push(`- Wallet: ${wallet.name}`);
      }
    }
    
    // If specifically asking for transactions, show a detailed list
    if (showMoreTransactions) {
      lines.push('', '### Last 10 Transactions');
      sortedTransactions.slice(0, transactionLimit).forEach((t, index) => {
        const date = dateFormatter.format(new Date(t.date));
        const catName = t.category?.name || 'Uncategorized';
        const amount = t.type === 'expense' ? `-$${Math.abs(t.amount).toFixed(2)}` : `+$${t.amount.toFixed(2)}`;
        lines.push(`${index+1}. ${t.description || 'No description'} (${amount}) - ${catName} on ${date}`);
      });
      
      // Add a summary of transaction types
      const typeCount = {
        expense: sortedTransactions.filter(t => t.type === 'expense').length,
        income: sortedTransactions.filter(t => t.type === 'income').length,
        transfer: sortedTransactions.filter(t => t.type === 'transfer').length
      };
      
      lines.push('', '### Transaction Summary');
      lines.push(`- Total transactions: ${sortedTransactions.length}`);
      lines.push(`- Expenses: ${typeCount.expense}`);
      lines.push(`- Income: ${typeCount.income}`);
      lines.push(`- Transfers: ${typeCount.transfer || 0}`);
    } else {
      // Standard format with separate income and expense sections
      // Income transactions
      lines.push('', '### Income');
      const incomes = sortedTransactions.filter(t => t.type === 'income');
      
      if (incomes.length > 0) {
        incomes.slice(0, 3).forEach(t => {
          const date = dateFormatter.format(new Date(t.date));
          const catName = t.category?.name || 'Uncategorized';
          lines.push(`- ${t.description || 'No description'} ($${t.amount.toFixed(2)}) - ${catName} on ${date}`);
        });
      } else {
        lines.push('No income transactions found in your recent history.');
      }
      
      // Expense transactions
      lines.push('', '### Expenses');
      const expenses = sortedTransactions.filter(t => t.type === 'expense');
      
      if (expenses.length > 0) {
        expenses.slice(0, 5).forEach(t => {
          const date = dateFormatter.format(new Date(t.date));
          const catName = t.category?.name || 'Uncategorized';
          lines.push(`- ${t.description || 'No description'} ($${Math.abs(t.amount).toFixed(2)}) - ${catName} on ${date}`);
        });
      } else {
        lines.push('No expense transactions found in your recent history.');
      }
    }
    
    // Add spending by category summary
    if (expenses.length > 0) {
      lines.push('', '### Spending by Category');
      const categorySpending = {};
      
      expenses.forEach(t => {
        const catName = t.category?.name || 'Uncategorized';
        if (!categorySpending[catName]) categorySpending[catName] = 0;
        categorySpending[catName] += Math.abs(t.amount);
      });
      
      Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([category, amount]) => {
          lines.push(`- ${category}: $${amount.toFixed(2)}`);
        });
    }
  } else {
    lines.push('No transaction history available.');
  }
}

/**
 * Add enhanced sections based on question analysis
 * @param {Object} ctx - The context object
 * @param {Array} lines - The array of lines to append to
 * @param {Object} questionAnalysis - Analysis of the user's question
 */
function addEnhancedSections(ctx, lines, questionAnalysis) {
  // If user is asking about unnecessary expenses, add detailed category breakdown
  if (questionAnalysis.specificDataRequests.recommendations) {
    lines.push('', '## EXPENSE ANALYSIS');
    
    if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
      const expenses = ctx.recentTransactions.filter(t => t.type === 'expense');
      
      // Group by category
      const categorySpending = {};
      expenses.forEach(t => {
        const catName = t.category?.name || 'Uncategorized';
        if (!categorySpending[catName]) {
          categorySpending[catName] = {
            total: 0,
            count: 0,
            transactions: []
          };
        }
        categorySpending[catName].total += Math.abs(t.amount);
        categorySpending[catName].count += 1;
        categorySpending[catName].transactions.push(t);
      });
      
      // Find categories with high frequency small transactions (potential unnecessary spending)
      const potentialUnnecessary = Object.entries(categorySpending)
        .filter(([_, data]) => data.count >= 3 && data.total / data.count < 20)
        .sort((a, b) => b[1].count - a[1].count);
      
      if (potentialUnnecessary.length > 0) {
        lines.push('### Potential Unnecessary Expenses');
        potentialUnnecessary.forEach(([category, data]) => {
          lines.push(`- ${category}: $${data.total.toFixed(2)} (${data.count} transactions, avg $${(data.total / data.count).toFixed(2)})`);
          // Show example transactions
          data.transactions.slice(0, 2).forEach(t => {
            lines.push(`  • ${t.description || 'No description'}: $${Math.abs(t.amount).toFixed(2)} on ${dateFormatter.format(new Date(t.date))}`);
          });
        });
      }
      
      // Find categories where spending exceeds budget
      if (ctx.budgets && ctx.budgets.length > 0) {
        const overBudget = ctx.budgets.filter(b => {
          const spent = b.spent || 0;
          return b.amount > 0 && spent / b.amount > 0.9;
        });
        
        if (overBudget.length > 0) {
          lines.push('', '### Over-Budget Categories');
          overBudget.forEach(budget => {
            const categoryName = budget.category?.name || 'Uncategorized';
            const spent = budget.spent || 0;
            const percentUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
            lines.push(`- ${categoryName}: $${spent.toFixed(2)}/$${budget.amount.toFixed(2)} (${percentUsed}% used)`);
          });
        }
      }
    }
  }
}

module.exports = {
  formatEnhancedContext,
  formatBalanceSection,
  formatBudgetSection,
  formatEnhancedBudgetSection,
  formatEnhancedTransactionsSection,
  formatBillsSection,
  formatSavingsGoalsSection,
  formatFinancialSummarySection,
  formatNetWorthSection
};
