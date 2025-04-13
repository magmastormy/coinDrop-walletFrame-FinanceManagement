const { spawn } = require('child_process');
const path = require('path');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');

// Helper functions from userController
const calculateMonthlyIncome = async (userId) => {
    try {
        if (!userId) {
            console.error('calculateMonthlyIncome: No userId provided');
            return 0;
        }
        
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        console.log(`calculateMonthlyIncome: Fetching income for user ${userId} since ${firstDayOfMonth.toISOString()}`);

        const incomeTransactions = await Transaction.find({
            userId,
            type: 'income',
            date: { $gte: firstDayOfMonth }
        });

        console.log(`calculateMonthlyIncome: Found ${incomeTransactions.length} income transactions`);
        
        // If no income transactions found, check if there might be date formatting issues
        if (incomeTransactions.length === 0) {
            // Try fetching recent income transactions without date filter to check if any exist
            const recentIncome = await Transaction.find({
                userId,
                type: 'income'
            }).limit(5).sort({ createdAt: -1 });
            
            console.log(`calculateMonthlyIncome: Found ${recentIncome.length} recent income transactions without date filter`);
            
            if (recentIncome.length > 0) {
                console.log('calculateMonthlyIncome: Sample transaction date format:', recentIncome[0].date);
            }
        }

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        console.log(`calculateMonthlyIncome: Total income calculated: ${totalIncome}`);
        
        return totalIncome;
    } catch (error) {
        console.error('Error in calculateMonthlyIncome:', error);
        return 0;
    }
};

const calculateBudgetStatus = async (budgets, userId) => {
    if (!budgets || budgets.length === 0) return {};
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get all category IDs from budgets
    const categoryIds = budgets
        .filter(b => b.category?._id)
        .map(b => b.category._id);
    
    // Fetch all transactions for these categories in one query
    const transactions = await Transaction.find({
        userId,
        category: { $in: categoryIds },
        type: 'expense',
        date: { $gte: firstDayOfMonth }
    });
    
    // Group transactions by category
    const transactionsByCategory = {};
    transactions.forEach(t => {
        const catId = t.category.toString();
        if (!transactionsByCategory[catId]) {
            transactionsByCategory[catId] = 0;
        }
        transactionsByCategory[catId] += Math.abs(t.amount);
    });
    
    // Create budget status object
    const status = {};
    budgets.forEach(budget => {
        if (!budget.category) return;
        
        const catId = budget.category._id.toString();
        status[budget.category.name] = {
            limit: budget.amount,
            spent: transactionsByCategory[catId] || 0
        };
    });
    
    return status;
};

const formatFinancialContext = (userData) => {
    const { income, transactions, budgetStatus } = userData;
    
    const transactionText = transactions.map(t => 
        `- ${t.category.name}: ${t.amount} (${new Date(t.date).toLocaleDateString()})`
    ).join('\n');

    const budgetText = Object.entries(budgetStatus)
        .map(([category, { spent, limit }]) => 
            `- ${category}: Spent ${spent} of ${limit}`
        ).join('\n');

    return `As a financial advisor, analyze this user's financial data and provide specific advice:

Monthly Income: ${income}

Recent Transactions:
${transactionText}

Budget Status:
${budgetText}

Please provide:
1. Analysis of spending patterns
2. Specific areas of concern
3. Actionable recommendations for improvement
4. Other suggestions and insights
5. Do not be technical. Only provide general insights.`;
};

const analyzeUserActivity = async (transactions, budgets) => {
    try {
        console.log(`analyzeUserActivity: Analyzing ${transactions.length} transactions and ${budgets.length} budgets`);
        
        const insights = [];
        
        if (!transactions || transactions.length === 0) {
            console.log('analyzeUserActivity: No transactions to analyze');
            insights.push("We don't have enough transaction data to provide insights yet. Try adding some transactions.");
            return insights;
        }
        
        // 1. Analyze spending patterns
        const categorySpending = {};
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        console.log(`analyzeUserActivity: Found ${expenseTransactions.length} expense transactions`);
        
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
        
        console.log(`analyzeUserActivity: Generated ${insights.length} insights`);
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

const calculateMonthlySpending = async (userId) => {
    if (!userId) return 0;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenseTransactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: firstDayOfMonth }
    });

    return expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
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

const getUserFinancialContext = async (userId) => {
    try {
        // Get user's wallet balances
        const wallets = await Wallet.find({ userId });
        
        // Get total balance
        const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        
        // Get recent transactions
        const recentTransactions = await Transaction.find({ userId })
            .sort({ date: -1 })
            .limit(10)
            .populate('category')
            .populate('walletId');
            
        // Get active budgets
        const budgets = await Budget.find({ userId, status: 'active' })
            .populate('category');
            
        // Get savings goals with detailed progress
        const savingsGoals = await SavingsGoal.find({ userId });

        // Calculate upcoming bills and automations
        const now = new Date();
        const thirtyDaysLater = new Date(now);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        // Find recurring transactions (identify potential bills)
        const recurringTransactions = await findRecurringTransactionsAndDueDates(userId, now, thirtyDaysLater);
        
        // Calculate savings progress
        const savingsAccounts = await SavingsAccount.find({ userId }).lean();
        
        // Calculate bill due dates
        // For this example, we'll extract recurring expenses from recent transactions
        const upcomingBills = await findUpcomingBills(userId, now, thirtyDaysLater);
        
        // Estimated monthly expenses & income
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        
        const monthlyTransactions = await Transaction.find({
            userId,
            date: { $gte: firstDayOfMonth }
        });
        
        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Format budget status with percentage used
        const formattedBudgets = budgets.map(budget => {
            const totalSpent = budget.totalSpent || 0;
            const percentUsed = budget.amount > 0 ? Math.round((totalSpent / budget.amount) * 100) : 0;
            const remaining = budget.amount - totalSpent;
            return {
                name: budget.name,
                category: budget.category?.name || 'Uncategorized',
                amount: budget.amount,
                spent: totalSpent,
                percentUsed: percentUsed,
                remaining: remaining,
                isOverBudget: totalSpent > budget.amount
            };
        });
        
        // Format savings goals with time remaining and completion estimates
        const formattedSavingsGoals = savingsGoals.map(goal => {
            const progressPercent = goal.targetAmount > 0 
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
                : 0;
                
            let timeRemaining = null;
            let monthlyContributionNeeded = null;
            
            if (goal.deadline) {
                const deadlineDate = new Date(goal.deadline);
                const monthsLeft = Math.max(0, Math.ceil((deadlineDate - now) / (30 * 24 * 60 * 60 * 1000)));
                timeRemaining = monthsLeft;
                
                if (monthsLeft > 0) {
                    monthlyContributionNeeded = (goal.targetAmount - goal.currentAmount) / monthsLeft;
                }
            }
            
            return {
                name: goal.name,
                description: goal.description,
                target: goal.targetAmount,
                current: goal.currentAmount,
                progress: progressPercent,
                deadline: goal.deadline,
                timeRemaining: timeRemaining,
                monthlyNeeded: monthlyContributionNeeded,
                isAchievable: timeRemaining ? monthlyNeeded < monthlyIncome * 0.2 : null
            };
        });
        
        // Format savings accounts with automation details
        const formattedSavingsAccounts = savingsAccounts.map(account => {
            let nextContribution = null;
            
            if (account.automation && account.automation.type !== 'none') {
                // Calculate next contribution date based on frequency
                const nextDate = calculateNextContributionDate(account.automation, now);
                const contributionAmount = account.automation.type === 'percentage' 
                    ? (monthlyIncome * account.automation.percentage / 100)
                    : account.automation.amount;
                    
                nextContribution = {
                    date: nextDate,
                    amount: contributionAmount,
                    frequency: account.automation.frequency
                };
            }
            
            return {
                name: account.name,
                balance: account.balance,
                hasAutomation: !!account.automation && account.automation.type !== 'none',
                automationType: account.automation?.type || 'none',
                nextContribution
            };
        });
        
        // Format the context data
        return {
            wallets: wallets.map(w => ({
                name: w.name,
                balance: w.balance,
                type: w.type,
                currency: w.currency || 'USD'
            })),
            totalBalance,
            recentTransactions: recentTransactions.map(t => ({
                type: t.type,
                amount: t.amount,
                category: t.category?.name || 'Uncategorized',
                date: t.date,
                wallet: t.walletId?.name || 'Unknown'
            })),
            budgets: formattedBudgets,
            savingsGoals: formattedSavingsGoals,
            savingsAccounts: formattedSavingsAccounts,
            upcomingBills,
            recurringTransactions,
            financialSummary: {
                monthlyIncome,
                monthlyExpenses,
                savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0,
                netWorth: totalBalance
            }
        };
    } catch (error) {
        console.error('Error in getUserFinancialContext:', error);
        return {
            wallets: [],
            totalBalance: 0,
            recentTransactions: [],
            budgets: [],
            savingsGoals: [],
            savingsAccounts: [],
            upcomingBills: [],
            recurringTransactions: [],
            financialSummary: {
                monthlyIncome: 0,
                monthlyExpenses: 0,
                savingsRate: 0,
                netWorth: 0
            }
        };
    }
};

// Helper function to find recurring transactions and estimate next due dates
const findRecurringTransactionsAndDueDates = async (userId, startDate, endDate) => {
    try {
        // Get the last 3 months of transactions
        const threeMonthsAgo = new Date(startDate);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const transactions = await Transaction.find({
            userId,
            type: 'expense',
            date: { $gte: threeMonthsAgo }
        }).populate('category').sort({ date: -1 });
        
        // Group transactions by similar amounts and payees to identify recurring ones
        const recurringPatterns = {};
        
        transactions.forEach(transaction => {
            // Create a signature combining category, amount (rounded), and description keywords
            const amount = Math.round(transaction.amount);
            const description = transaction.description || '';
            const categoryName = transaction.category?.name || 'Uncategorized';
            
            // Simple signature based on amount and category
            const signature = `${categoryName}-${amount}`;
            
            if (!recurringPatterns[signature]) {
                recurringPatterns[signature] = {
                    transactions: [],
                    category: categoryName,
                    amount,
                    description: description,
                    frequency: null,
                    nextDueDate: null
                };
            }
            
            recurringPatterns[signature].transactions.push({
                date: new Date(transaction.date),
                amount: transaction.amount
            });
        });
        
        // Analyze patterns for recurring transactions (at least 2 occurrences)
        const recurringTransactions = [];
        
        for (const key in recurringPatterns) {
            const pattern = recurringPatterns[key];
            
            if (pattern.transactions.length >= 2) {
                // Sort by date descending
                pattern.transactions.sort((a, b) => b.date - a.date);
                
                // Calculate average time between transactions
                let totalDays = 0;
                let intervals = 0;
                
                for (let i = 0; i < pattern.transactions.length - 1; i++) {
                    const daysDiff = Math.round((pattern.transactions[i].date - pattern.transactions[i + 1].date) / (24 * 60 * 60 * 1000));
                    totalDays += daysDiff;
                    intervals++;
                }
                
                if (intervals > 0) {
                    const avgDays = totalDays / intervals;
                    
                    // Determine frequency (monthly, weekly, etc.)
                    let frequency = 'unknown';
                    if (avgDays >= 25 && avgDays <= 35) frequency = 'monthly';
                    else if (avgDays >= 6 && avgDays <= 8) frequency = 'weekly';
                    else if (avgDays >= 13 && avgDays <= 16) frequency = 'bi-weekly';
                    
                    // Calculate next due date
                    const lastDate = pattern.transactions[0].date;
                    const nextDueDate = new Date(lastDate);
                    nextDueDate.setDate(nextDueDate.getDate() + avgDays);
                    
                    if (nextDueDate > startDate && nextDueDate < endDate) {
                        recurringTransactions.push({
                            category: pattern.category,
                            amount: pattern.amount,
                            description: pattern.description,
                            frequency,
                            lastDate,
                            nextDueDate,
                            daysUntilDue: Math.round((nextDueDate - startDate) / (24 * 60 * 60 * 1000))
                        });
                    }
                }
            }
        }
        
        // Sort by next due date
        return recurringTransactions.sort((a, b) => a.nextDueDate - b.nextDueDate);
    } catch (error) {
        console.error('Error in findRecurringTransactionsAndDueDates:', error);
        return [];
    }
};

// Helper to find upcoming bills
const findUpcomingBills = async (userId, startDate, endDate) => {
    try {
        // For demonstration, we'll return the recurring transactions 
        // that have descriptions containing typical bill keywords
        const recurringTransactions = await findRecurringTransactionsAndDueDates(userId, startDate, endDate);
        
        const billKeywords = ['bill', 'subscription', 'rent', 'mortgage', 'utilities', 'water', 
                              'electric', 'gas', 'phone', 'internet', 'insurance', 'loan', 'payment'];
                              
        const bills = recurringTransactions.filter(tx => {
            if (!tx.description) return false;
            const desc = tx.description.toLowerCase();
            return billKeywords.some(keyword => desc.includes(keyword));
        });
        
        return bills;
    } catch (error) {
        console.error('Error in findUpcomingBills:', error);
        return [];
    }
};

// Helper to calculate next contribution date based on automation settings
const calculateNextContributionDate = (automation, fromDate) => {
    if (!automation || automation.frequency === 'none') {
        return null;
    }
    
    const result = new Date(fromDate);
    
    switch (automation.frequency) {
        case 'daily':
            result.setDate(result.getDate() + 1);
            break;
        case 'weekly':
            result.setDate(result.getDate() + 7);
            break;
        case 'bi-weekly':
            result.setDate(result.getDate() + 14);
            break;
        case 'monthly':
            result.setMonth(result.getMonth() + 1);
            break;
        case 'quarterly':
            result.setMonth(result.getMonth() + 3);
            break;
        default:
            return null;
    }
    
    return result;
};

exports.sendMessage = async (req, res, next) => {
    console.log('Sending message to ZhipuAI');
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages must be an array' });
        }

        const messagesJson = JSON.stringify(messages);
        const pythonScriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
        
        const pythonProcess = spawn('python', [pythonScriptPath, messagesJson]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python script error: ${data.toString()}`);
        });

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            next(new Error('Python script execution timed out after 30 seconds'));
        }, 30000); // 30 second timeout

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && output) {
                try {
                    const responseData = JSON.parse(output);
                    if (responseData.error) {
                        next(new Error(responseData.error));
                    } else {
                        res.json({ response: responseData.response || responseData.message });
                    }
                } catch (error) {
                    next(new Error(`Failed to parse Python script output: ${error.message}`));
                }
            } else {
                const errorMessage = errorOutput || `Python script exited with code ${code}`;
                next(new Error(errorMessage));
            }
        });

        pythonProcess.on('error', (error) => {
            next(new Error(`Failed to start Python script: ${error.message}`));
        });

    } catch (error) {
        next(error);
    }
};

exports.getFinancialAdvice = async (req, res, next) => {
    try {
        const userId = req.user._id || req.query.userId || req.user.userId;
        
        // Get regular transactions (non-transfers)
        const transactions = await Transaction.find({ 
            userId,
            type: { $ne: 'transfer' }
        })
        .sort({ date: -1 })
        .limit(10)
        .populate('category', 'name')
        .lean();

        // Get transfers
        const transfers = await Transaction.find({
            userId,
            type: 'transfer'
        })
        .sort({ date: -1 })
        .limit(10)
        .lean();

        // Get budgets with populated categories
        const budgets = await Budget.find({ userId })
            .populate('category', 'name')
            .lean();

        const income = await calculateMonthlyIncome(userId);
        const budgetStatus = await calculateBudgetStatus(budgets, userId);

        // Format transactions for AI
        const formattedTransactions = [
            ...transactions.map(t => ({
                type: t.type,
                amount: t.amount,
                category: t.category?.name || 'Uncategorized',
                description: t.description,
                date: t.date
            })),
            ...transfers.map(t => ({
                type: 'transfer',
                amount: t.amount,
                category: 'Transfer',
                description: t.description,
                date: t.date
            }))
        ];

        const message = {
            role: 'user',
            content: JSON.stringify({
                monthlyIncome: income,
                recentTransactions: formattedTransactions,
                budgetStatus
            })
        };

        // Use Python script for GLM integration
        const messagesJson = JSON.stringify([message]);
        const pythonScriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
        
        const pythonProcess = spawn('python', [pythonScriptPath, messagesJson]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python script error: ${data.toString()}`);
        });

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            next(new Error('Python script execution timed out after 30 seconds'));
        }, 30000); // 30 second timeout

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && output) {
                try {
                    const responseData = JSON.parse(output);
                    if (responseData.error) {
                        next(new Error(responseData.error));
                    } else {
                        const aiResponse = responseData.response || responseData.message;
                        res.json({ 
                            advice: aiResponse,
                            context: {
                                monthlyIncome: income,
                                recentTransactions: formattedTransactions,
                                budgetStatus
                            }
                        });
                    }
                } catch (error) {
                    next(new Error(`Failed to parse Python script output: ${error.message}`));
                }
            } else {
                const errorMessage = errorOutput || `Python script exited with code ${code}`;
                next(new Error(errorMessage));
            }
        });

        pythonProcess.on('error', (error) => {
            next(new Error(`Failed to start Python script: ${error.message}`));
        });

    } catch (error) {
        console.error('Error in getFinancialAdvice:', error);
        next(error);
    }
};

// Controller functions that use the above helpers
exports.getProactiveInsights = async (req, res, next) => {
    try {
        const userId = req.user._id || req.params.userId;
        
        // Fetch recent transactions
        const recentTransactions = await Transaction.find({ userId })
            .sort({ date: -1 })
            .limit(10)
            .populate('category', 'name');
        
        // Fetch budgets
        const budgets = await Budget.find({ userId })
            .populate('category', 'name');
        
        // Generate insights
        const insights = await analyzeUserActivity(recentTransactions, budgets);
        
        res.json({ insights });
    } catch (error) {
        next(error);
    }
};

exports.getUserAccountInfo = async (req, res) => {
    try {
        const userId = req.user._id || req.params.userId;
        
        // Simple response for now
        const wallets = await Wallet.find({ userId });
        const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        
        // Return a simplified context object
        res.json({ 
            context: {
                wallets: wallets.map(w => ({
                    name: w.name,
                    balance: w.balance,
                    type: w.type,
                    currency: w.currency || 'USD'
                })),
                totalBalance,
                // Include minimal data to get things working
                recentTransactions: [],
                budgets: [],
                savingsGoals: [],
                savingsAccounts: [],
                upcomingBills: [],
                recurringTransactions: [],
                financialSummary: {
                    monthlyIncome: 0,
                    monthlyExpenses: 0,
                    savingsRate: 0,
                    netWorth: totalBalance
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserAccountInfo:', error);
        res.status(500).json({ 
            error: 'Failed to get account information',
            details: error.message
        });
    }
};

exports.getContextSuggestions = async (req, res, next) => {
    try {
        const userId = req.user._id || req.params.userId;
        
        // First check if user has any transactions
        const transactionCount = await Transaction.countDocuments({ userId });
        
        if (transactionCount === 0) {
            return res.json({ 
                suggestions: {
                    generalAdvice: ["We need more transaction history to provide personalized suggestions."]
                }
            });
        }
        
        // Fetch all necessary data
        const [
            transactions,
            budgets,
            savingsGoals,
            netWorth,
            wallets
        ] = await Promise.all([
            Transaction.find({ userId })
                .sort({ date: -1 })
                .limit(20)
                .populate('category', 'name'),
            Budget.find({ userId })
                .populate('category', 'name'),
            SavingsGoal.find({ userId }),
            calculateNetWorth(userId),
            Wallet.find({ userId })
        ]);
        
        // Generate context-aware suggestions
        const suggestions = await generateContextSuggestions({
            transactions,
            budgets,
            savingsGoals,
            netWorth,
            wallets
        });
        
        // Include wallet balances in the response
        const walletBalances = wallets.map(w => ({
            name: w.name,
            type: w.type,
            balance: w.balance,
            currency: w.currency || 'USD'
        }));
        
        res.json({ 
            suggestions,
            walletBalances,
            totalBalance: walletBalances.reduce((sum, w) => sum + w.balance, 0) 
        });
    } catch (error) {
        next(error);
    }
};

const generateContextSuggestions = async ({
    transactions,
    budgets,
    savingsGoals,
    netWorth,
    wallets
}) => {
    try {
        console.log('generateContextSuggestions: Generating context-aware suggestions');
        
        const suggestions = {
            spendingInsights: [],
            savingsRecommendations: [],
            budgetAdjustments: [],
            generalAdvice: []
        };

        // Check if we have enough data to provide meaningful suggestions
        if (!transactions || transactions.length === 0) {
            console.log('generateContextSuggestions: No transactions available');
            suggestions.generalAdvice.push("We need more transaction history to provide personalized suggestions.");
            return suggestions;
        }

        const userId = transactions[0]?.userId;
        if (!userId) {
            console.log('generateContextSuggestions: No userId found in transactions');
            suggestions.generalAdvice.push("User identification is missing. Please try logging out and back in.");
            return suggestions;
        }

        // 1. Analyze spending trends
        const monthlySpending = await calculateMonthlySpending(userId);
        const monthlyIncome = await calculateMonthlyIncome(userId);
        
        console.log(`generateContextSuggestions: Monthly income: ${monthlyIncome}, Monthly spending: ${monthlySpending}`);
        
        // Add general income insights
        if (monthlyIncome <= 0) {
            suggestions.generalAdvice.push(
                "We couldn't detect any income this month. Make sure your income transactions are properly categorized."
            );
        } else {
            // Only calculate savings rate if we have valid income
            const savingsRate = (monthlyIncome - monthlySpending) / monthlyIncome;
            
            if (savingsRate < 0) {
                suggestions.spendingInsights.push(
                    "You're spending more than your income this month. Review your expenses to find areas to cut back."
                );
            } else if (savingsRate < 0.1) {
                suggestions.savingsRecommendations.push(
                    "Your savings rate is below 10%. Consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings."
                );
            } else if (savingsRate < 0.2) {
                suggestions.savingsRecommendations.push(
                    "Your current savings rate is almost 20%. You're on the right track! Consider setting up automatic transfers to a savings account."
                );
            } else {
                suggestions.generalAdvice.push(
                    `Great job! You're saving ${Math.round(savingsRate * 100)}% of your income. Consider investing some of your savings for long-term growth.`
                );
            }
        }

        // 2. Budget analysis
        if (budgets && budgets.length > 0) {
            console.log(`generateContextSuggestions: Analyzing ${budgets.length} budgets`);
            const budgetStatus = await calculateBudgetStatus(budgets, userId);
            
            Object.entries(budgetStatus).forEach(([category, { spent, limit }]) => {
                const spendingRatio = spent / limit;
                
                if (spendingRatio > 1.0) {
                    suggestions.budgetAdjustments.push(
                        `You've exceeded your ${category} budget by ${Math.round((spendingRatio - 1) * 100)}%. Review your spending or adjust your budget.`
                    );
                } else if (spendingRatio > 0.9) {
                    suggestions.budgetAdjustments.push(
                        `You're close to exceeding your ${category} budget (${Math.round(spendingRatio * 100)}% used). Consider adjusting spending or increasing the budget.`
                    );
                } else if (spendingRatio < 0.2 && new Date().getDate() > 20) {
                    // If we're late in the month and spending is very low in this category
                    suggestions.budgetAdjustments.push(
                        `You've only used ${Math.round(spendingRatio * 100)}% of your ${category} budget. Consider reducing this budget to free up funds.`
                    );
                }
            });
        } else {
            suggestions.generalAdvice.push(
                "You don't have any budgets set up. Creating budgets helps track and control your spending."
            );
        }

        // 3. Savings goals progress
        if (savingsGoals?.length > 0) {
            console.log(`generateContextSuggestions: Analyzing ${savingsGoals.length} savings goals`);
            for (const goal of savingsGoals) {
                const progressRatio = goal.currentAmount / goal.targetAmount;
                
                if (goal.deadline) {
                    const monthsLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (30 * 24 * 60 * 60 * 1000));
                    
                    if (monthsLeft <= 0) {
                        suggestions.savingsRecommendations.push(
                            `Your deadline for ${goal.name} has passed. You've saved ${Math.round(progressRatio * 100)}% of your goal. Consider extending the deadline.`
                        );
                    } else if (monthsLeft > 0) {
                        const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsLeft;
                        
                        if (progressRatio < 0.1) {
                            suggestions.savingsRecommendations.push(
                                `Your progress towards ${goal.name} is just starting. You need to save ${requiredMonthly.toFixed(2)} per month to reach your goal.`
                            );
                        } else if (progressRatio < 0.5) {
                            suggestions.savingsRecommendations.push(
                                `To reach your ${goal.name} goal (${Math.round(progressRatio * 100)}% complete), you need to save ${requiredMonthly.toFixed(2)} per month.`
                            );
                        } else if (progressRatio < 0.9) {
                            suggestions.savingsRecommendations.push(
                                `You're making good progress on your ${goal.name} goal (${Math.round(progressRatio * 100)}% complete). Keep saving ${requiredMonthly.toFixed(2)} per month.`
                            );
                        } else {
                            suggestions.savingsRecommendations.push(
                                `You're almost at your ${goal.name} goal! Just ${(goal.targetAmount - goal.currentAmount).toFixed(2)} more to go.`
                            );
                        }
                    }
                } else {
                    // No deadline set
                    suggestions.savingsRecommendations.push(
                        `You've saved ${Math.round(progressRatio * 100)}% of your ${goal.name} goal. Setting a deadline can help you stay motivated.`
                    );
                }
            }
        } else {
            suggestions.generalAdvice.push(
                "Consider setting up savings goals for things you want to accomplish in the future."
            );
        }

        // 4. General financial health
        if (netWorth && netWorth.total > 0) {
            console.log(`generateContextSuggestions: Net worth total: ${netWorth.total}, liquid: ${netWorth.liquid || 0}`);
            const emergencyFund = netWorth.liquid || 0;
            
            if (monthlySpending > 0) {
                const emergencyFundRatio = emergencyFund / monthlySpending;
                
                if (emergencyFundRatio < 1) {
                    suggestions.generalAdvice.push(
                        "Your emergency fund is less than 1 month of expenses. Focus on building this up immediately."
                    );
                } else if (emergencyFundRatio < 3) {
                    suggestions.generalAdvice.push(
                        "Your emergency fund covers about " + emergencyFundRatio.toFixed(1) + " months of expenses. Aim for 3-6 months."
                    );
                } else if (emergencyFundRatio < 6) {
                    suggestions.generalAdvice.push(
                        "Your emergency fund is in good shape at " + emergencyFundRatio.toFixed(1) + " months of expenses. Consider investing additional savings."
                    );
                }
            }
        } else {
            suggestions.generalAdvice.push(
                "Start building your net worth by saving and paying down debt."
            );
        }
        
        // Ensure we have at least one suggestion in each category
        if (suggestions.spendingInsights.length === 0) {
            // Analyze spending categories
            const expensesByCategory = {};
            transactions.forEach(t => {
                if (t.type === 'expense') {
                    const categoryName = t.category?.name || 'Uncategorized';
                    expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + Math.abs(t.amount);
                }
            });
            
            // Find top spending category
            let maxCategory = '';
            let maxAmount = 0;
            
            Object.entries(expensesByCategory).forEach(([category, amount]) => {
                if (amount > maxAmount) {
                    maxCategory = category;
                    maxAmount = amount;
                }
            });
            
            if (maxCategory && maxAmount > 0) {
                suggestions.spendingInsights.push(
                    `Your highest spending category is ${maxCategory} at $${maxAmount.toFixed(2)}. Review if this aligns with your priorities.`
                );
            }
        }
        
        // Log final suggestions
        console.log('generateContextSuggestions: Generated suggestions:', {
            spendingInsights: suggestions.spendingInsights.length,
            savingsRecommendations: suggestions.savingsRecommendations.length,
            budgetAdjustments: suggestions.budgetAdjustments.length,
            generalAdvice: suggestions.generalAdvice.length
        });
        
        return suggestions;
    } catch (error) {
        console.error('Error in generateContextSuggestions:', error);
        return {
            spendingInsights: [],
            savingsRecommendations: [],
            budgetAdjustments: [],
            generalAdvice: ["An error occurred while generating suggestions. Please try again later."]
        };
    }
};

// Make sure all exports are properly defined
module.exports = {
    sendMessage: exports.sendMessage,
    getFinancialAdvice: exports.getFinancialAdvice,
    getProactiveInsights: exports.getProactiveInsights,
    getContextSuggestions: exports.getContextSuggestions,
    getUserAccountInfo: exports.getUserAccountInfo
};