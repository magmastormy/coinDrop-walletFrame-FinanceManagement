const { spawn } = require('child_process');
const path = require('path');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const status = {};

    for (const budget of budgets) {
        if (!budget.category) continue;

        const transactions = await Transaction.find({
            userId,
            category: budget.category._id,
            type: 'expense',
            date: { $gte: firstDayOfMonth }
        });

        status[budget.category.name] = {
            limit: budget.amount,
            spent: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        };
    }

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

exports.sendMessage = async (req, res, next) => {
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

        pythonProcess.on('close', (code) => {
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

        pythonProcess.on('close', (code) => {
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