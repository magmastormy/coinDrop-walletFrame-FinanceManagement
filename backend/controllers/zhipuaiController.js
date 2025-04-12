const { spawn } = require('child_process');
const path = require('path');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');

// Helper functions from userController
const calculateMonthlyIncome = async (userId) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const incomeTransactions = await Transaction.find({
        userId,
        type: 'income',
        date: { $gte: firstDayOfMonth }
    });

    return incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
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
    const insights = [];
    
    // 1. Analyze spending patterns
    const categorySpending = transactions.reduce((acc, t) => {
        if (t.type === 'expense') {
            const category = t.category?.name || 'Uncategorized';
            acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        }
        return acc;
    }, {});

    // Find unusual spending patterns
    for (const [category, amount] of Object.entries(categorySpending)) {
        const budget = budgets.find(b => b.category?.name === category);
        if (budget) {
            const spendingRatio = amount / budget.amount;
            if (spendingRatio > 0.8) {
                insights.push(`You've spent ${Math.round(spendingRatio * 100)}% of your ${category} budget. Consider reviewing your spending in this category.`);
            }
        }
    }

    // 2. Analyze transaction frequency
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= last24Hours);
    if (recentTransactions.length > 5) {
        insights.push("You've made several transactions in the last 24 hours. Would you like to review them?");
    }

    // 3. Identify potential savings opportunities
    const recurringExpenses = findRecurringExpenses(transactions);
    if (recurringExpenses.length > 0) {
        insights.push(`I noticed recurring expenses in: ${recurringExpenses.join(', ')}. Would you like to analyze these for potential savings?`);
    }

    return insights;
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
            netWorth
        ] = await Promise.all([
            Transaction.find({ userId })
                .sort({ date: -1 })
                .limit(20)
                .populate('category', 'name'),
            Budget.find({ userId })
                .populate('category', 'name'),
            SavingsGoal.find({ userId }),
            calculateNetWorth(userId)
        ]);
        
        // Generate context-aware suggestions
        const suggestions = await generateContextSuggestions({
            transactions,
            budgets,
            savingsGoals,
            netWorth
        });
        
        res.json({ suggestions });
    } catch (error) {
        next(error);
    }
};

const generateContextSuggestions = async ({
    transactions,
    budgets,
    savingsGoals,
    netWorth
}) => {
    const suggestions = {
        spendingInsights: [],
        savingsRecommendations: [],
        budgetAdjustments: [],
        generalAdvice: []
    };

    const userId = transactions[0]?.userId;
    if (!userId) {
        suggestions.generalAdvice.push("No transaction data available for analysis.");
        return suggestions;
    }

    // 1. Analyze spending trends
    const monthlySpending = await calculateMonthlySpending(userId);
    const monthlyIncome = await calculateMonthlyIncome(userId);
    
    if (monthlyIncome > 0) {
        const savingsRate = (monthlyIncome - monthlySpending) / monthlyIncome;
        if (savingsRate < 0.2) {
            suggestions.savingsRecommendations.push(
                "Your current savings rate is below 20%. Consider setting up automatic transfers to a savings account."
            );
        }
    } else {
        suggestions.generalAdvice.push(
            "We couldn't detect any income this month. Make sure your income transactions are properly categorized."
        );
    }

    // 2. Budget analysis
    const budgetStatus = await calculateBudgetStatus(budgets, userId);
    Object.entries(budgetStatus).forEach(([category, { spent, limit }]) => {
        const spendingRatio = spent / limit;
        if (spendingRatio > 0.9) {
            suggestions.budgetAdjustments.push(
                `You're close to exceeding your ${category} budget. Consider adjusting spending or increasing the budget if necessary.`
            );
        }
    });

    // 3. Savings goals progress
    if (savingsGoals?.length > 0) {
        for (const goal of savingsGoals) {
            const progressRatio = goal.currentAmount / goal.targetAmount;
            if (progressRatio < 0.5 && goal.deadline) {
                const monthsLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (30 * 24 * 60 * 60 * 1000));
                if (monthsLeft > 0) {
                    const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsLeft;
                    suggestions.savingsRecommendations.push(
                        `To reach your ${goal.name} goal, you need to save ${requiredMonthly.toFixed(2)} per month.`
                    );
                }
            }
        }
    }

    // 4. General financial health
    if (netWorth?.total > 0 && monthlySpending > 0) {
        const emergencyFund = netWorth.liquid || 0;
        const emergencyFundRatio = emergencyFund / monthlySpending;

        if (emergencyFundRatio < 3) {
            suggestions.generalAdvice.push(
                "Your emergency fund could use a boost. Aim for 3-6 months of expenses in easily accessible savings."
            );
        }
    }

    return suggestions;
};