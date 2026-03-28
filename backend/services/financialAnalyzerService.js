const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const isDev = process.env.NODE_ENV !== 'production';

const analyzeUserActivity = async (transactions, budgets) => {
    try {
        if (isDev) console.log(`analyzeUserActivity: Analyzing ${transactions.length} transactions and ${budgets.length} budgets`);
        
        const insights = [];
        
        if (!transactions || transactions.length === 0) {
            if (isDev) console.log('analyzeUserActivity: No transactions to analyze');
            insights.push("We don't have enough transaction data to provide insights yet. Try adding some transactions.");
            return insights;
        }
        
        // 1. Analyze spending patterns
        const categorySpending = {};
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        if (isDev) console.log(`analyzeUserActivity: Found ${expenseTransactions.length} expense transactions`);
        
        // Group by category
        expenseTransactions.forEach(t => {
            const categoryName = t.category?.name || (t.category?.id ? `Category ${t.category.id}` : 'Uncategorized');
            const amount = Math.abs(t.amount);
            
            if (!categorySpending[categoryName]) {
                categorySpending[categoryName] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }
            
            categorySpending[categoryName].total += amount;
            categorySpending[categoryName].count++;
            categorySpending[categoryName].transactions.push({
                amount,
                date: t.date,
                description: t.description
            });
        });
        
        // Analyze each category against budget
        for (const [category, data] of Object.entries(categorySpending)) {
            // Find matching budget if any
            const budget = budgets.find(b => {
                const budgetCategory = b.category?.name || '';
                return budgetCategory.toLowerCase() === category.toLowerCase();
            });
            
            if (budget) {
                const spendingRatio = data.total / budget.amount;
                if (spendingRatio > 0.9) {
                    insights.push(`⚠️ You've spent ${Math.round(spendingRatio * 100)}% of your ${category} budget. Consider adjusting your spending.`);
                } else if (spendingRatio > 0.75) {
                    insights.push(`You've spent ${Math.round(spendingRatio * 100)}% of your ${category} budget. You're on track but keep an eye on this category.`);
                }
            } else if (data.total > 200) {
                // High spending in category without budget
                insights.push(`You've spent $${data.total.toFixed(2)} on ${category} this month. Consider creating a budget for this category.`);
            }
            
            // Frequent small transactions insight
            if (data.count > 5 && data.total / data.count < 20) {
                insights.push(`You have ${data.count} small transactions in ${category}. These small purchases can add up quickly.`);
            }
        }

        // 2. Analyze transaction frequency by time period
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentTransactions = transactions.filter(t => {
            try {
                const txDate = new Date(t.date);
                return txDate >= last24Hours;
            } catch (e) {
                console.error(`Error parsing date ${t.date}:`, e);
                return false;
            }
        });
        
        if (recentTransactions.length > 5) {
            insights.push("📊 You've made several transactions in the last 24 hours. Would you like to review your recent spending?");
        }

        // 3. Identify potential savings opportunities
        const recurringExpenses = findRecurringExpenses(transactions);
        if (recurringExpenses.length > 0) {
            insights.push(`💰 I noticed recurring expenses in: ${recurringExpenses.join(', ')}. These might be subscription services you could optimize.`);
        }
        
        // 4. Analyze transaction timing patterns
        const weekendTransactions = transactions.filter(t => {
            try {
                const txDate = new Date(t.date);
                const day = txDate.getDay();
                return day === 0 || day === 6; // Sunday or Saturday
            } catch (e) {
                return false;
            }
        });
        
        if (weekendTransactions.length > 5) {
            const weekendTotal = weekendTransactions.reduce((sum, t) => 
                t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0);
            insights.push(`Your weekend spending ($${weekendTotal.toFixed(2)}) seems high. Consider planning weekend activities in advance.`);
        }
        
        // Add fallback insights if none were generated
        if (insights.length === 0) {
            if (transactions.length < 10) {
                insights.push("Add more transactions to get personalized financial insights.");
            } else {
                insights.push("Your spending looks balanced across categories. Keep up the good work!");
            }
        }
        
        if (isDev) console.log(`analyzeUserActivity: Generated ${insights.length} insights`);
        return insights;
    } catch (error) {
        console.error('Error in analyzeUserActivity:', error);
        return ["We encountered an error analyzing your financial data. Please try again later."];
    }
};

const findRecurringExpenses = (transactions) => {
    const monthlyPatterns = {};
    
    transactions.forEach(t => {
        if (t.type === 'expense') {
            const key = `${t.category?.name}-${Math.abs(t.amount)}`;
            monthlyPatterns[key] = (monthlyPatterns[key] || 0) + 1;
        }
    });

    return Object.entries(monthlyPatterns)
        .filter(([_, count]) => count >= 2)
        .map(([key]) => key.split('-')[0]);
};

const calculateNetWorth = async (userId) => {
    // Fetch all wallets for the user
    const wallets = await Wallet.find({ userId });
    
    // Calculate total assets
    const total = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    
    // Calculate liquid assets (assume checking/savings accounts are liquid)
    const liquid = wallets
        .filter(w => ['checking', 'savings'].includes(w.type))
        .reduce((sum, wallet) => sum + wallet.balance, 0);
    
    return { total, liquid };
};

// Stub missing helper functions for use in context service
const findRecurringTransactionsAndDueDates = async (userId, startDate, endDate) => {
  // Placeholder: return empty list
  return [];
};

const findUpcomingBills = async (userId, startDate, endDate) => {
  // Placeholder: return empty list
  return [];
};

module.exports = {
    analyzeUserActivity,
    findRecurringExpenses,
    calculateNetWorth,
    findRecurringTransactionsAndDueDates,
    findUpcomingBills
};
