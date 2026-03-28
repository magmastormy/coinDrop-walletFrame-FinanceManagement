const isDev = process.env.NODE_ENV !== 'production';

/**
 * Helper function to enhance context data with additional calculations and information
 */
async function enhanceContextData(ctx, userId, { isBudgetQuery, isBalanceQuery, isSavingsQuery, isBillQuery }) {
    if (isDev) console.log(`[enhanceContextData] Enhancing data for queries: budget=${isBudgetQuery}, balance=${isBalanceQuery}, savings=${isSavingsQuery}, bills=${isBillQuery}`);
    
    // Calculate if this is a general financial overview
    const isFinancialOverview = isBudgetQuery && isBalanceQuery;
    
    // Process budget data if needed
    if ((isBudgetQuery || isFinancialOverview) && (!ctx.budgets || ctx.budgets.length === 0)) {
        // Double-check if budgets exist directly from the database
        const Budget = require('../models/Budget');
        const directBudgets = await Budget.find({ userId }).lean();
        if (isDev) console.log(`[enhanceContextData] Direct budget check: found ${directBudgets.length} budgets`);
        if (directBudgets.length > 0) {
            ctx.budgets = directBudgets;
            if (isDev) console.log("[enhanceContextData] Updated context with direct budgets");
        }
    }
    
    // ALWAYS process transactions to improve expense data quality regardless of query type
    try {
        if (isDev) console.log("[enhanceContextData] Processing all transaction data for comprehensive expense analysis");
        
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        
        // Get all transactions for better analysis
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({
            userId
        }).populate('category', 'name').sort({ date: -1 }).limit(50);
        
        if (isDev) console.log(`[enhanceContextData] Found ${transactions.length} transactions for analysis`);
        
        // Store all transactions for UI display
        ctx.allTransactions = transactions;
        
        // Extract expenses for this month for budget calculation
        const currentMonthTransactions = transactions.filter(t => {
            try {
                const txDate = new Date(t.date);
                return txDate >= firstOfMonth && t.type === 'expense';
            } catch (e) {
                return false;
            }
        });
        
        if (isDev) console.log(`[enhanceContextData] ${currentMonthTransactions.length} expense transactions in current month`);
        
        // Calculate spent amount for each budget
        if (ctx.budgets && ctx.budgets.length > 0) {
            if (isDev) console.log("[enhanceContextData] Processing budget data with transactions");
            ctx.budgets = ctx.budgets.map(budget => {
                // Handle if budget is already a plain object from lean() query
                const budgetObj = typeof budget.toObject === 'function' ? budget.toObject() : budget;
                
                // Find transactions that match this budget's category
                const matchingTransactions = currentMonthTransactions.filter(t => {
                    const budgetCategoryId = budgetObj.category ? 
                        (typeof budgetObj.category === 'object' ? budgetObj.category._id.toString() : budgetObj.category.toString()) : 
                        null;
                    const transactionCategoryId = t.category ? 
                        (typeof t.category === 'object' ? t.category._id.toString() : t.category.toString()) : 
                        null;
                    return budgetCategoryId === transactionCategoryId;
                });
                
                // Calculate total spent
                const spent = matchingTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const remaining = budgetObj.amount - spent;
                const percentUsed = budgetObj.amount > 0 ? (spent / budgetObj.amount) * 100 : 0;
                
                // Add these calculated fields to the budget object
                return {
                    ...budgetObj,
                    spent,
                    remaining,
                    percentUsed,
                    transactions: matchingTransactions.slice(0, 5) // Include up to 5 recent transactions for this budget
                };
            });
        }
        
        // Add expense analytics to context
        ctx.expenseAnalytics = analyzeExpenses(transactions);
        
    } catch (error) {
        console.error('[enhanceContextData] Error processing transactions:', error);
    }
    
    // Enhance wallet data if needed
    if (isBalanceQuery && ctx.wallets) {
        if (isDev) console.log("[enhanceContextData] Processing wallet data");
        // Add more details to wallets if needed
        ctx.wallets = ctx.wallets.map(wallet => {
            const walletObj = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;
            return {
                ...walletObj,
                formattedBalance: `$${walletObj.balance.toFixed(2)}`
            };
        });
    }
    
    // Always process savings goals to ensure data is properly formatted
    if (ctx.savingsGoals && ctx.savingsGoals.length > 0) {
        if (isDev) console.log("[enhanceContextData] Processing savings goals");
        ctx.savingsGoals = ctx.savingsGoals.map(goal => {
            const goalObj = typeof goal.toObject === 'function' ? goal.toObject() : goal;
            
            // Map the database field names to the expected names used in the formatContext function
            const current = goalObj.currentAmount || 0;
            const target = goalObj.targetAmount || 0;
            
            // Calculate progress percentage
            const progress = target > 0 ? (current / target) * 100 : 0;
            
            // Calculate time remaining if target date exists
            let timeRemaining = null;
            let monthlyNeeded = null;
            
            if (goalObj.deadline) {
                const now = new Date();
                const targetDate = new Date(goalObj.deadline);
                const monthsDiff = (targetDate.getFullYear() - now.getFullYear()) * 12 + 
                                   (targetDate.getMonth() - now.getMonth());
                
                if (monthsDiff > 0) {
                    timeRemaining = monthsDiff;
                    monthlyNeeded = (target - current) / monthsDiff;
                }
            }
            
            return {
                ...goalObj,
                // Add the expected field names that formatContext uses
                current,
                target,
                progress: progress.toFixed(1),
                timeRemaining,
                monthlyNeeded
            };
        });
        
        if (isDev) console.log(`[enhanceContextData] Processed ${ctx.savingsGoals.length} savings goals with field mapping`);
    }
    
    // Log completion
    if (isDev) console.log("[enhanceContextData] Data enhancement complete");
    return ctx;
}

/**
 * Helper function to analyze expenses from transactions
 */
function analyzeExpenses(transactions) {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const expensesByCategory = {};
    const expensesByMonth = {};
    let totalExpenses = 0;
    
    // Process each expense transaction
    expenseTransactions.forEach(transaction => {
        const amount = Math.abs(transaction.amount);
        totalExpenses += amount;
        
        // Group by category
        const categoryName = transaction.category?.name || 'Uncategorized';
        if (!expensesByCategory[categoryName]) {
            expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += amount;
        
        // Group by month
        try {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()+1}`;
            if (!expensesByMonth[monthKey]) {
                expensesByMonth[monthKey] = 0;
            }
            expensesByMonth[monthKey] += amount;
        } catch (e) {
            console.error('Error parsing date:', e);
        }
    });
    
    // Calculate percentage by category
    const categoriesWithPercentage = {};
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
        categoriesWithPercentage[category] = {
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        };
    });
    
    // Find top expense categories
    const topCategories = Object.entries(categoriesWithPercentage)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 3)
        .map(([category, data]) => ({
            category,
            amount: data.amount,
            percentage: data.percentage
        }));
    
    // Find expense trend
    const sortedMonths = Object.entries(expensesByMonth)
        .sort(([monthA], [monthB]) => monthA.localeCompare(monthB));
    
    const trend = sortedMonths.length >= 2 ? 
        (sortedMonths[sortedMonths.length-1][1] - sortedMonths[sortedMonths.length-2][1]) : 0;
    
    return {
        totalExpenses,
        expensesByCategory: categoriesWithPercentage,
        topCategories,
        monthlyTrend: trend,
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        monthlyData: expensesByMonth
    };
}

module.exports = {
    enhanceContextData,
    analyzeExpenses
};
