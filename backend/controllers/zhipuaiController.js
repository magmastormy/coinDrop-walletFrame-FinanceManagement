const Wallet = require('../models/Wallet');
const aiClient = require('../services/aiClient');
const contextService = require('../services/zhipuaiContextService');
const questionAnalyzer = require('../services/questionAnalyzer');
const enhancedContextFormatter = require('../services/formatters/enhancedContextFormatter');

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

exports.sendMessage = async (req, res, next) => {
    try {
        const { messages, userId: bodyUserId } = req.body;
        if (!Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages must be an array' });
        }

        // Use userId from JWT token, request body, or params in that order of preference
        const userId = req.user?._id || bodyUserId || req.params.userId;
        console.log(`[ZhipuaiController - sendMessage] Processing request for user: ${userId}`);
        console.log(`[ZhipuaiController - sendMessage] User ID sources: JWT=${!!req.user?._id}, Body=${!!bodyUserId}, Params=${!!req.params.userId}`);
        
        if (!userId) {
            console.error('[ZhipuaiController - sendMessage] No user ID available from any source');
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Add detailed debug logging for user info
        console.log(`[ZhipuaiController - DEBUG] User object:`, JSON.stringify({
            id: userId,
            auth: !!req.user,
            headers: req.headers['authorization'] ? 'Auth header present' : 'No auth header'
        }));
        
        // Determine the type of query to better format the context
        const userMsgs = messages.filter(m => m.role === 'user');
        if (!userMsgs.length) {
            return res.status(400).json({ error: 'No user message provided' });
        }
        
        const lastUser = userMsgs[userMsgs.length - 1];
        const userMessage = lastUser.content;
        console.log(`[ZhipuaiController - sendMessage] User message: "${lastUser.content.substring(0, 50)}${lastUser.content.length > 50 ? '...' : ''}"`);
        
        // Analyze the question using the question analyzer
        const questionAnalysis = questionAnalyzer.analyzeQuestion(userMessage);
        console.log(`[ZhipuaiController - sendMessage] Question analysis: ${JSON.stringify({
            isMultiPart: questionAnalysis.isMultiPart,
            parts: questionAnalysis.parts.length,
            specificDataRequests: Object.entries(questionAnalysis.specificDataRequests)
                .filter(([_, value]) => value)
                .map(([key, _]) => key)
        })}`);
        
        // Detect query type for better context formatting
        const userMessageLower = userMessage.toLowerCase();
        const isBalanceQuery = /\b(balance|account|wallet|how much|check balance|money in)\b/i.test(userMessageLower);
        const isBudgetQuery = /\b(budgets?|spending|expenses|spent|overspent)\b/i.test(userMessageLower);
        const isSavingsQuery = /\b(saving|goal|target|emergency fund|tuition)\b/i.test(userMessageLower);
        const isBillQuery = /\b(bills?|payment|due|upcoming|recurring|subscription)\b/i.test(userMessageLower);
        const isFinancialQuery = isBalanceQuery || isBudgetQuery || isSavingsQuery || isBillQuery || 
                                /\b(money|financial|finance|income|automations|transfer)\b/i.test(userMessageLower) ||
                                questionAnalysis.specificDataRequests.lastTransaction || 
                                questionAnalysis.specificDataRequests.specificTransaction ||
                                questionAnalysis.specificDataRequests.transactionByCategory;
        
        // Check for general greetings or simple messages that don't need context
        const isGeneralGreeting = /^\s*(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening|bye|goodbye|see you|thanks|thank you|ok|okay|sure|yes|no|maybe|cool|great|awesome|nice|good|got it)\s*[.!?]*\s*$/i.test(userMessageLower);
        
        // Check for very short messages (likely not requiring financial context)
        const isVeryShortMessage = userMessageLower.trim().split(/\s+/).length <= 2;
        
        // Check for general questions that don't relate to finances
        // Expanded to catch philosophical questions and general knowledge queries
        const isGeneralQuestion = (/\b(what is|who is|how do|can you|tell me about|explain|define|where is|when is|why is|which)\b/i.test(userMessageLower) && !isFinancialQuery) ||
                                 /\b(life|universe|philosophy|meaning|existence|theory|science|biology|physics|religion|god|spirituality|consciousness|mind|soul|ethics|morality)\b/i.test(userMessageLower) && !isFinancialQuery;
        
        // Check for chat-like interactions
        const isChatInteraction = /\b(how are you|what do you think|your opinion|can you help|what can you do|your capabilities|tell me a joke|fun fact)\b/i.test(userMessageLower);
        
        // Check for transaction-related terms that should always trigger financial context
        const hasTransactionTerms = /\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|spend|spending|bought|paid)\b/i.test(userMessageLower);
        
        // Check for budget and savings terms
        const hasBudgetTerms = /\b(budget|budgets)\b/i.test(userMessageLower);
        const hasSavingsTerms = /\b(saving|savings|goal|goals)\b/i.test(userMessageLower);
        
        // Update financial query detection to include transaction, budget, and savings terms
        if (hasTransactionTerms) {
            console.log(`[ZhipuaiController - sendMessage] Detected transaction terms, treating as financial query`);
            isFinancialQuery = true;
        }
        
        if (hasBudgetTerms) {
            console.log(`[ZhipuaiController - sendMessage] Detected budget terms, treating as financial query`);
            isFinancialQuery = true;
            isBudgetQuery = true;
        }
        
        if (hasSavingsTerms) {
            console.log(`[ZhipuaiController - sendMessage] Detected savings terms, treating as financial query`);
            isFinancialQuery = true;
            isSavingsQuery = true;
        }
        
        // Skip context for general greetings, very short non-financial messages, general questions, or chat interactions
        // BUT don't skip if we have specific data requests from question analysis or transaction terms
        const hasSpecificDataRequests = Object.values(questionAnalysis.specificDataRequests).some(value => value);
        const skipContext = (isGeneralGreeting || 
                           (isVeryShortMessage && !isFinancialQuery) || 
                           isGeneralQuestion || 
                           isChatInteraction) && 
                           !hasSpecificDataRequests && 
                           !hasTransactionTerms;
        
        console.log(`[ZhipuaiController - sendMessage] Query type: ${isBalanceQuery ? 'balance' : ''}${isBudgetQuery ? 'budget' : ''}${isSavingsQuery ? 'savings' : ''}${isBillQuery ? 'bills' : ''}${!isFinancialQuery ? 'general' : ''}`);
        console.log(`[ZhipuaiController - sendMessage] Skip context: ${skipContext}`);
        
        let prompt = '';
        // Initialize ctx variable with an empty object
        let ctx = {};
        
        // Skip context for general greetings or very short non-financial messages
        if (skipContext) {
            console.log(`[ZhipuaiController - sendMessage] Skipping context for general message`);
            // Use a minimal prompt that allows broader thinking
            prompt = `You are a helpful financial assistant for the CoinDrip application. 
For this message, no specific financial context is needed. 
Feel free to draw on your general knowledge to provide a helpful response.
Keep your response concise and avoid unnecessary line breaks.

If the user is asking about general topics unrelated to finance, you can provide information based on your knowledge.
If the user is asking about your capabilities, explain that you're an AI assistant specialized in financial matters but can also help with general questions.`;
        } else {
            // Fetch user context from database for financial queries
            console.log(`[ZhipuaiController - DEBUG] About to fetch context for user ID: ${userId}`);
            
            try {
                // Check if user exists in database
                const User = require('../models/User');
                const userExists = await User.findById(userId);
                console.log(`[ZhipuaiController - DEBUG] User exists check: ${!!userExists}`);
                
                if (!userExists) {
                    console.error(`[ZhipuaiController - ERROR] User with ID ${userId} not found in database`);
                }
            } catch (dbError) {
                console.error(`[ZhipuaiController - DEBUG] Error checking user: ${dbError.message}`);
            }
            
            const ctx = await contextService.getContext(userId);
            console.log("[ZhipuaiController - sendMessage] Context loaded with:", 
                JSON.stringify({
                    budgets: ctx.budgets?.length || 0,
                    wallets: ctx.wallets?.length || 0,
                    transactions: ctx.recentTransactions?.length || 0,
                    savingsGoals: ctx.savingsGoals?.length || 0,
                    categories: ctx.categories?.length || 0
                }));

            // Check for missing data and log database information
            if (!ctx.budgets || ctx.budgets.length === 0) {
                console.log(`[ZhipuaiController - DEBUG] No budgets found, checking database directly`);
                try {
                    const Budget = require('../models/Budget');
                    const budgetCount = await Budget.countDocuments({ userId });
                    console.log(`[ZhipuaiController - DEBUG] Direct budget count from DB: ${budgetCount}`);
                    
                    // Sample a budget document to check if userId field matches expected format
                    const sampleBudget = await Budget.findOne({}).lean();
                    if (sampleBudget) {
                        console.log(`[ZhipuaiController - DEBUG] Sample budget userId: ${sampleBudget.userId}, type: ${typeof sampleBudget.userId}`);
                        console.log(`[ZhipuaiController - DEBUG] Requested userId: ${userId}, type: ${typeof userId}`);
                    }
                } catch (dbError) {
                    console.error(`[ZhipuaiController - DEBUG] Database check error: ${dbError.message}`);
                }
            }

            // Process all financial data based on query type
            await enhanceContextData(ctx, userId, { 
                isBudgetQuery, 
                isBalanceQuery, 
                isSavingsQuery: true, // Always process savings goals
                isBillQuery 
            });

            // Choose format type based on query
            let formatType = 'full';
            if (isBudgetQuery) formatType = 'budget';
            else if (isBalanceQuery) formatType = 'balance';
            else if (isSavingsQuery) formatType = 'savings';
            else if (isBillQuery) formatType = 'bills';
            
            // Use enhanced context formatter for better handling of specific data requests
            if (hasSpecificDataRequests || questionAnalysis.isMultiPart) {
                console.log(`[ZhipuaiController - sendMessage] Using enhanced context formatter for specific data requests`);
                prompt = enhancedContextFormatter.formatEnhancedContext(ctx, formatType, questionAnalysis);
                
                // Add any additional context based on question analysis
                try {
                    const additionalContext = questionAnalyzer.generateAdditionalContext(questionAnalysis, ctx);
                    if (additionalContext && additionalContext.length > 0) {
                        prompt += '\n\n' + additionalContext;
                        console.log(`[ZhipuaiController - sendMessage] Added ${additionalContext.length} chars of additional context`);
                    }
                } catch (error) {
                    console.error(`[ZhipuaiController - sendMessage] Error generating additional context: ${error.message}`);
                }
            } else {
                // Use standard formatter for simple queries
                prompt = contextService.formatContext(ctx, formatType);
            }
            console.log(`[ZhipuaiController - sendMessage] Formatted ${formatType} prompt (${prompt.length} chars)`);
        }
        
        // Add a directive to encourage broader thinking beyond the immediate context
        let systemPrompt = skipContext ? prompt : 
            `${prompt}\n\nAdditional instructions:\n1. Feel free to draw on your general knowledge beyond the provided context when appropriate.\n2. Keep your response concise and avoid unnecessary line breaks.\n3. If the user's question isn't directly related to their financial data, you can provide general advice.\n4. Format your response with proper spacing - use single line breaks between paragraphs instead of multiple empty lines.\n5. When appropriate, consider broader financial concepts and principles that might be helpful to the user.\n6. You can reference external financial resources or concepts if they would be helpful to the user.`;
        
        // Enhance the prompt with question-specific instructions if needed
        if (!skipContext && (questionAnalysis.isMultiPart || hasSpecificDataRequests)) {
            systemPrompt = questionAnalyzer.enhancePrompt(systemPrompt, questionAnalysis);
            console.log(`[ZhipuaiController - sendMessage] Enhanced prompt with question-specific instructions`);
        }
        
        const aiInput = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: lastUser.content }
        ];

        console.log("[ZhipuaiController - sendMessage] Sending request to AI service");
        const aiResponse = await aiClient.send(aiInput);
        console.log(`[ZhipuaiController - sendMessage] AI response received (${aiResponse.length} chars)`);

        return res.json({ response: aiResponse, context: ctx });
    } catch (err) {
        console.error('[ZhipuaiController - sendMessage] Error:', err);
        next(err);
    }
};

/**
 * Helper function to enhance context data with additional calculations and information
 */
async function enhanceContextData(ctx, userId, { isBudgetQuery, isBalanceQuery, isSavingsQuery, isBillQuery }) {
    console.log(`[enhanceContextData] Enhancing data for queries: budget=${isBudgetQuery}, balance=${isBalanceQuery}, savings=${isSavingsQuery}, bills=${isBillQuery}`);
    
    // Calculate if this is a general financial overview
    const isFinancialOverview = isBudgetQuery && isBalanceQuery;
    
    // Process budget data if needed
    if ((isBudgetQuery || isFinancialOverview) && (!ctx.budgets || ctx.budgets.length === 0)) {
        // Double-check if budgets exist directly from the database
        const Budget = require('../models/Budget');
        const directBudgets = await Budget.find({ userId }).lean();
        console.log(`[enhanceContextData] Direct budget check: found ${directBudgets.length} budgets`);
        if (directBudgets.length > 0) {
            ctx.budgets = directBudgets;
            console.log("[enhanceContextData] Updated context with direct budgets");
        }
    }
    
    // ALWAYS process transactions to improve expense data quality regardless of query type
    try {
        console.log("[enhanceContextData] Processing all transaction data for comprehensive expense analysis");
        
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        
        // Get all transactions for better analysis
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({
            userId
        }).populate('category', 'name').sort({ date: -1 }).limit(50);
        
        console.log(`[enhanceContextData] Found ${transactions.length} transactions for analysis`);
        
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
        
        console.log(`[enhanceContextData] ${currentMonthTransactions.length} expense transactions in current month`);
        
        // Calculate spent amount for each budget
        if (ctx.budgets && ctx.budgets.length > 0) {
            console.log("[enhanceContextData] Processing budget data with transactions");
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
        console.log("[enhanceContextData] Processing wallet data");
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
        console.log("[enhanceContextData] Processing savings goals");
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
        
        console.log(`[enhanceContextData] Processed ${ctx.savingsGoals.length} savings goals with field mapping`);
    }
    
    // Log completion
    console.log("[enhanceContextData] Data enhancement complete");
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

exports.getFinancialAdvice = async (req, res, next) => {
    try {
        const userId = req.user._id || req.query.userId || req.user.userId;
        console.log(`[getFinancialAdvice] Fetching financial data for user: ${userId}`);
        
        const ctx = await contextService.getContext(userId);
        
        // Enhance financial data
        await enhanceContextData(ctx, userId, {
            isBudgetQuery: true,
            isBalanceQuery: true,
            isSavingsQuery: true,
            isBillQuery: true
        });
        
        const prompt = contextService.formatContext(ctx, 'full');
        console.log(`[getFinancialAdvice] Prepared prompt (${prompt.length} chars), requesting AI advice`);
        
        const aiResponse = await aiClient.send([{ role: 'system', content: prompt }]);
        console.log(`[getFinancialAdvice] Received AI response (${aiResponse.length} chars)`);

        return res.json({ advice: aiResponse, context: ctx });
    } catch (err) {
        console.error(`[getFinancialAdvice] Error:`, err);
        next(err);
    }
};

// Controller functions that use the above helpers
exports.getProactiveInsights = async (req, res, next) => {
    try {
        const userId = req.user._id || req.params.userId;
        const ctx = await contextService.getContext(userId);
        const insights = await analyzeUserActivity(ctx.recentTransactions, ctx.budgets);
        return res.json({ insights });
    } catch (err) {
        next(err);
    }
};

exports.getUserAccountInfo = async (req, res, next) => {
    try {
        const userId = req.user._id || req.params.userId;
        console.log(`[getUserAccountInfo] Fetching account info for user: ${userId}`);
            
        // Fetch comprehensive user context
        const ctx = await contextService.getContext(userId);
        console.log(`[getUserAccountInfo] Data retrieved: budgets=${ctx.budgets?.length || 0}, wallets=${ctx.wallets?.length || 0}`);
            
        // Enhance all data for client-side consumption
        await enhanceContextData(ctx, userId, {
            isBudgetQuery: true, 
            isBalanceQuery: true, 
            isSavingsQuery: true, 
            isBillQuery: true
        });
            
        console.log(`[getUserAccountInfo] Enhanced data complete, returning to client`);
        return res.json({ context: ctx });
    } catch (err) {
        console.error(`[getUserAccountInfo] Error:`, err);
        next(err);
    }
};

exports.getContextSuggestions = async (req, res, next) => {
    try {
        const userId = req.user._id || req.params.userId;
        console.log(`[getContextSuggestions] Generating suggestions for user: ${userId}`);
        
        // Fetch comprehensive context
        const ctx = await contextService.getContext(userId);
        console.log(`[getContextSuggestions] Context loaded with ${ctx.budgets?.length || 0} budgets, ${ctx.wallets?.length || 0} wallets`);
        
        if (!ctx.recentTransactions?.length) {
            console.log(`[getContextSuggestions] No transaction history available`);
            return res.json({ suggestions: { generalAdvice: [
                "We need more transaction history to provide personalized suggestions."
            ] } });
        }
        
        // Enhance data to ensure accurate suggestions
        await enhanceContextData(ctx, userId, {
            isBudgetQuery: true, 
            isBalanceQuery: true,
            isSavingsQuery: true,
            isBillQuery: false // Skip bill processing for suggestions
        });
        
        // Generate personalized suggestions based on enhanced data
        const suggestions = await contextService.generateContextSuggestions(ctx);
        console.log(`[getContextSuggestions] Generated ${Object.keys(suggestions).length} suggestion categories`);
        
        const walletBalances = ctx.wallets.map(w => ({
            name: w.name, 
            type: w.type, 
            balance: w.balance, 
            currency: w.currency || 'USD'
        }));
        
        return res.json({ suggestions, walletBalances, totalBalance: ctx.totalBalance });
    } catch (err) {
        console.error('[getContextSuggestions] Error:', err);
        next(err);
    }
};

exports.getUserContext = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user._id;
        console.log(`[getUserContext] Fetching raw context for user: ${userId}`);
        
        // Get raw context without enhancements for diagnostics/debugging
        const ctx = await contextService.getContext(userId);
        
        console.log(`[getUserContext] Retrieved data overview: 
            Budgets: ${ctx.budgets?.length || 0}
            Wallets: ${ctx.wallets?.length || 0}
            Transactions: ${ctx.recentTransactions?.length || 0}
            Categories: ${ctx.categories?.length || 0}
            SavingsGoals: ${ctx.savingsGoals?.length || 0}`);
        
        // If data is missing, log additional diagnostics
        if (!ctx.budgets || ctx.budgets.length === 0) {
            console.log(`[getUserContext] WARNING: No budgets found for user ${userId}`);
            // Direct database check
            const Budget = require('../models/Budget');
            const directCount = await Budget.countDocuments({ userId });
            console.log(`[getUserContext] Direct DB check: found ${directCount} budgets in database`);  
        }
        
        return res.json(ctx);
    } catch (err) {
        console.error('[getUserContext] Error:', err);
        next(err);
    }
};

// Make sure all exports are properly defined
module.exports = {
    sendMessage: exports.sendMessage,
    getFinancialAdvice: exports.getFinancialAdvice,
    getProactiveInsights: exports.getProactiveInsights,
    getContextSuggestions: exports.getContextSuggestions,
    getUserAccountInfo: exports.getUserAccountInfo,
    getUserContext: exports.getUserContext,
    calculateNetWorth,
    findRecurringTransactionsAndDueDates,
    findUpcomingBills
};