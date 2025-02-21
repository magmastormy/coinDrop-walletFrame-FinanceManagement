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
        date: { $gte: firstDayOfMonth },
        amount: { $gt: 0 }
    });

    return incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
};

const calculateBudgetStatus = async (budgets, userId) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const status = {};

    for (const budget of budgets) {
        const transactions = await Transaction.find({
            userId,
            category: budget.category._id,
            date: { $gte: firstDayOfMonth }
        });

        const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        status[budget.category.name] = {
            spent,
            limit: budget.amount
        };
    }

    return status;
};

// Format financial data for AI
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
3. Actionable recommendations for improvement`;
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
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(10)
            .populate('category', 'name');

        const budgets = await Budget.find({ userId: req.user.id })
            .populate('category', 'name');

        const income = await calculateMonthlyIncome(req.user.id);
        const budgetStatus = await calculateBudgetStatus(budgets, req.user.id);

        const message = {
            role: 'user',
            content: formatFinancialContext({
                income,
                transactions,
                budgetStatus
            })
        };

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
                        res.json({ advice: aiResponse });
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