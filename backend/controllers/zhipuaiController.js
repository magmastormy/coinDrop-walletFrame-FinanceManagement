const mongoose = require('mongoose');
const aiClient = require('../services/aiClient');
const contextService = require('../services/zhipuaiContextService');
const questionAnalyzer = require('../services/questionAnalyzer');
const enhancedContextFormatter = require('../services/formatters/enhancedContextFormatter');
const AIResponseValidator = require('../utils/aiResponseValidator');
const { validateMessages } = require('../utils/inputSanitizer');
const { getAuthenticatedUserId } = require('../utils/authUser');
const financialAnalyzerService = require('../services/financialAnalyzerService');
const contextEnhancementService = require('../services/contextEnhancementService');
const isDev = process.env.NODE_ENV !== 'production';


exports.sendMessage = async (req, res, next) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[ZhipuaiController - sendMessage][${requestId}] Received request`);
    
    try {
        const { messages } = req.body;
        console.log(`[ZhipuaiController - sendMessage][${requestId}] Received ${messages?.length || 0} messages`);
        
        // VALIDATE AND SANITIZE INPUT (Critical Security Fix)
        console.log(`[ZhipuaiController - sendMessage][${requestId}] Validating messages`);
        const validation = validateMessages(messages);
        if (!validation.valid) {
            console.error(`[ZhipuaiController - sendMessage][${requestId}] Validation failed: ${validation.error}`);
            return res.status(400).json({ 
                error: validation.error,
                code: 'INVALID_INPUT'
            });
        }
        
        // Use sanitized messages
        const sanitizedMessages = validation.sanitizedMessages;
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Processing request for user: ${userId}`);
        } catch (authError) {
            console.error(`[ZhipuaiController - sendMessage][${requestId}] Authentication error: ${authError.message}`);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
        
        if (!userId) {
            console.error(`[ZhipuaiController - sendMessage][${requestId}] No user ID available from any source`);
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Determine the type of query to better format the context
        const userMsgs = sanitizedMessages.filter(m => m.role === 'user');
        if (!userMsgs.length) {
            console.error(`[ZhipuaiController - sendMessage][${requestId}] No user message provided`);
            return res.status(400).json({ error: 'No user message provided' });
        }
        
        const lastUser = userMsgs[userMsgs.length - 1];
        const userMessage = lastUser.content; // Already sanitized
        console.log(`[ZhipuaiController - sendMessage][${requestId}] User message: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`);
        
        // Check for prompt injection attempts in user input
        const injectionCheck = AIResponseValidator.detectPromptInjection(userMessage);
        if (injectionCheck.isInjection) {
            console.warn(`[ZhipuaiController - sendMessage][${requestId}] Prompt injection attempt detected:`, injectionCheck.patterns);
            return res.status(400).json({
                error_code: 'PROMPT_INJECTION_DETECTED',
                message: 'Invalid input detected. Please rephrase your question.',
                details: 'Your message contains patterns that may attempt to manipulate the AI system'
            });
        }
        
        // Analyze the question using the question analyzer
        const questionAnalysis = questionAnalyzer.analyzeQuestion(userMessage);
        console.log(`[ZhipuaiController - sendMessage][${requestId}] Question analysis:`, {
            isMultiPart: questionAnalysis.isMultiPart,
            parts: questionAnalysis.parts.length,
            specificDataRequests: Object.entries(questionAnalysis.specificDataRequests)
                .filter(([_, value]) => value)
                .map(([key, _]) => key)
        });
        
        // Detect query type for better context formatting
        const userMessageLower = userMessage.toLowerCase();
        let isBalanceQuery = /\b(balance|account|wallet|how much|check balance|money in)\b/i.test(userMessageLower);
        let isBudgetQuery = /\b(budgets?|spending|expenses|spent|overspent)\b/i.test(userMessageLower);
        
        // Enhanced savings query detection
        let isSavingsQuery = /\b(saving|savings|goal|target|emergency fund|tuition|save up|put away|set aside)\b/i.test(userMessageLower) ||
                           questionAnalysis.specificDataRequests.savingsGoals ||
                           questionAnalysis.specificDataRequests.savingsAdvice;
                           
        let isBillQuery = /\b(bills?|payment|due|upcoming|recurring|subscription)\b/i.test(userMessageLower);
        
        // Enhanced financial query detection
        let isFinancialQuery = isBalanceQuery || isBudgetQuery || isSavingsQuery || isBillQuery || 
                                /\b(money|financial|finance|income|automations|transfer|invest|investing|investment)\b/i.test(userMessageLower) ||
                                questionAnalysis.specificDataRequests.lastTransaction || 
                                questionAnalysis.specificDataRequests.specificTransaction ||
                                questionAnalysis.specificDataRequests.transactionByCategory ||
                                questionAnalysis.specificDataRequests.financialPlanning ||
                                questionAnalysis.specificDataRequests.savingsAdvice;
        
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
        const hasSavingsTerms = /\b(saving|savings|goal|goals|save up|put away|set aside)\b/i.test(userMessageLower);
        
        // Update financial query detection to include transaction, budget, and savings terms
        if (hasTransactionTerms) {
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Detected transaction terms, treating as financial query`);
            isFinancialQuery = true;
        }
        
        // Ensure savings-related queries always get appropriate context
        if (hasSavingsTerms || questionAnalysis.specificDataRequests.savingsGoals || questionAnalysis.specificDataRequests.savingsAdvice) {
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Detected savings terms, treating as financial query`);
            isFinancialQuery = true;
            isSavingsQuery = true;
        }
        
        if (hasBudgetTerms) {
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Detected budget terms, treating as financial query`);
            isFinancialQuery = true;
            isBudgetQuery = true;
        }
        
        if (hasSavingsTerms) {
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Detected savings terms, treating as financial query`);
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
        
        console.log(`[ZhipuaiController - sendMessage][${requestId}] Query type: ${isBalanceQuery ? 'balance ' : ''}${isBudgetQuery ? 'budget ' : ''}${isSavingsQuery ? 'savings ' : ''}${isBillQuery ? 'bills ' : ''}${!isFinancialQuery ? 'general' : ''}`);
        console.log(`[ZhipuaiController - sendMessage][${requestId}] Skip context: ${skipContext}`);
        
        let prompt = '';
        // Initialize ctx variable with an empty object
        let ctx = {};
        
        // Skip context for general greetings or very short non-financial messages
        if (skipContext) {
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Skipping context for general message`);
            // Use a minimal prompt that allows broader thinking
            prompt = `You are a helpful financial assistant for the CoinDrip application. 
For this message, no specific financial context is needed. 
Feel free to draw on your general knowledge to provide a helpful response.
Keep your response concise and avoid unnecessary line breaks.

If the user is asking about general topics unrelated to finance, you can provide information based on your knowledge.
If the user is asking about your capabilities, explain that you're an AI assistant specialized in financial matters but can also help with general questions.`;
        } else {
            // Fetch user context from database for financial queries
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Fetching context`);
            
            try {
                // Check if user exists in database
                const User = require('../models/User');
                const userExists = await User.findById(userId);
                console.log(`[ZhipuaiController - sendMessage][${requestId}] User exists check: ${!!userExists}`);
                
                if (!userExists) {
                    console.error(`[ZhipuaiController - sendMessage][${requestId}] User with ID ${userId} not found in database`);
                }
            } catch (dbError) {
                console.error(`[ZhipuaiController - sendMessage][${requestId}] Error checking user: ${dbError.message}`);
            }
            
            // Fixed variable shadowing issue by using the existing ctx variable
            ctx = await contextService.getContext(userId);
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Context loaded with:`, {
                budgets: ctx.budgets?.length || 0,
                wallets: ctx.wallets?.length || 0,
                transactions: ctx.recentTransactions?.length || 0,
                savingsGoals: ctx.savingsGoals?.length || 0,
                categories: ctx.categories?.length || 0
            });

            // Check for missing data and log database information
            if (!ctx.budgets || ctx.budgets.length === 0) {
                console.log(`[ZhipuaiController - sendMessage][${requestId}] No budgets found, checking database directly`);
                try {
                    const Budget = require('../models/Budget');
                    const budgetCount = await Budget.countDocuments({ userId });
                    console.log(`[ZhipuaiController - sendMessage][${requestId}] Direct budget count from DB: ${budgetCount}`);
                    
                    // Sample a budget document to check if userId field matches expected format
                    const sampleBudget = await Budget.findOne({}).lean();
                    if (sampleBudget) {
                        console.log(`[ZhipuaiController - sendMessage][${requestId}] Sample budget userId: ${sampleBudget.userId}, type: ${typeof sampleBudget.userId}`);
                        console.log(`[ZhipuaiController - sendMessage][${requestId}] Requested userId: ${userId}, type: ${typeof userId}`);
                    }
                } catch (dbError) {
                    console.error(`[ZhipuaiController - sendMessage][${requestId}] Database check error: ${dbError.message}`);
                }
            }

            // Process all financial data based on query type
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Enhancing context data`);
            await contextEnhancementService.enhanceContextData(ctx, userId, { 
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
                console.log(`[ZhipuaiController - sendMessage][${requestId}] Using enhanced context formatter for specific data requests`);
                prompt = enhancedContextFormatter.formatEnhancedContext(ctx, formatType, questionAnalysis);
                
                // Add any additional context based on question analysis
                try {
                    const additionalContext = questionAnalyzer.generateAdditionalContext(questionAnalysis, ctx);
                    if (additionalContext && additionalContext.length > 0) {
                        prompt += '\n\n' + additionalContext;
                        console.log(`[ZhipuaiController - sendMessage][${requestId}] Added ${additionalContext.length} chars of additional context`);
                    }
                } catch (error) {
                    console.error(`[ZhipuaiController - sendMessage][${requestId}] Error generating additional context: ${error.message}`);
                }
            } else {
                // Use standard formatter for simple queries
                prompt = contextService.formatContext(ctx, formatType);
            }
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Formatted ${formatType} prompt (${prompt.length} chars)`);
        }
        
        // Add a directive to encourage broader thinking beyond the immediate context
        let systemPrompt = skipContext ? prompt : 
            `${prompt}

Additional instructions:
1. Feel free to draw on your general knowledge beyond the provided context when appropriate.
2. Keep your response concise and avoid unnecessary line breaks.
3. If the user's question isn't directly related to their financial data, you can provide general advice.
4. Format your response with proper spacing - use single line breaks between paragraphs instead of multiple empty lines.
5. When appropriate, consider broader financial concepts and principles that might be helpful to the user.
6. You can reference external financial resources or concepts if they would be helpful to the user.`;
        
        // Enhance the prompt with question-specific instructions if needed
        if (!skipContext && (questionAnalysis.isMultiPart || hasSpecificDataRequests)) {
            systemPrompt = questionAnalyzer.enhancePrompt(systemPrompt, questionAnalysis);
            console.log(`[ZhipuaiController - sendMessage][${requestId}] Enhanced prompt with question-specific instructions`);
        }
        
        const aiInput = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: lastUser.content }
        ];

        console.log(`[ZhipuaiController - sendMessage][${requestId}] Sending request to AI service`);
        
        try {
            // Add timeout to prevent hanging requests
            const aiResponsePromise = aiClient.send(aiInput, { timeoutMs: 25000 });
            
            // Use Promise.race to implement a controller-level timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Controller timeout exceeded')), 28000);
            });
            
            const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
            console.log(`[ZhipuaiController - sendMessage][${requestId}] AI response received (${aiResponse.length} chars): ${aiResponse.substring(0, 200)}${aiResponse.length > 200 ? '...' : ''}`);
            
            // Validate AI response
            const validation = await AIResponseValidator.validateAIResponse({
                input: lastUser.content,
                response: aiResponse
            }, {
                checkInjection: true,
                checkSafety: false, // Skip safety checks for performance
                validateSchema: false // Schema is optional for chat responses
            });
            
            if (!validation.valid) {
                console.error(`[ZhipuaiController - sendMessage][${requestId}] AI response validation failed:`, validation.errors);
                
                // Return safe fallback response
                return res.status(500).json({
                    error_code: 'AI_RESPONSE_VALIDATION_FAILED',
                    message: 'Unable to process AI response due to validation errors',
                    details: validation.errors.map(e => e.message || e.description)
                });
            }
            
            // Add warnings if any
            if (validation.warnings && validation.warnings.length > 0) {
                console.warn(`[ZhipuaiController - sendMessage][${requestId}] AI response has warnings:`, validation.warnings);
            }
            
            // Check if response has already been sent before attempting to send another
            if (!res.headersSent) {
                console.log(`[ZhipuaiController - sendMessage][${requestId}] Sending response to client`);
                return res.json({ response: aiResponse, context: ctx });
            } else {
                console.warn(`[ZhipuaiController - sendMessage][${requestId}] Headers already sent, skipping response`);
                return; // Return without sending another response
            }
        } catch (aiError) {
            console.error(`[ZhipuaiController - sendMessage][${requestId}] AI service error: ${aiError.message}`);
            
            // Check if response has already been sent
            if (!res.headersSent) {
                if (aiError.message.includes('timeout')) {
                    return res.status(503).json({
                        error: 'AI Service Timeout',
                        message: 'The AI service is currently experiencing high load. Please try again later.'
                    });
                } else if (aiError.message.includes('401') || aiError.message.includes('Authentication') || aiError.message.includes('身份验证')) {
                    return res.status(503).json({
                        error: 'AI Service Authentication Error',
                        message: 'The AI service is currently unavailable. Please try again later.'
                    });
                } else {
                    return res.status(500).json({
                        error: 'AI Service Error',
                        message: 'An error occurred while processing your request.'
                    });
                }
            } else {
                console.warn(`[ZhipuaiController - sendMessage][${requestId}] Headers already sent, cannot send error response`);
                return; // Return without sending another response
            }
        }
    } catch (err) {
        console.error(`[ZhipuaiController - sendMessage][${requestId}] Error:`, err);
        
        // Check if response has already been sent
        if (!res.headersSent) {
            next(err);
        } else {
            console.warn(`[ZhipuaiController - sendMessage][${requestId}] Headers already sent, cannot forward error to middleware`);
        }
    }
};



exports.getFinancialAdvice = async (req, res, next) => {
    try {
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
            if (isDev) console.log('[getFinancialAdvice] Fetching financial data');
        } catch (authError) {
            console.error('[getFinancialAdvice] Authentication error:', authError.message);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
        
        const ctx = await contextService.getContext(userId);
        
        // Enhance financial data
        await contextEnhancementService.enhanceContextData(ctx, userId, {
            isBudgetQuery: true,
            isBalanceQuery: true,
            isSavingsQuery: true,
            isBillQuery: true
        });
        
        const prompt = contextService.formatContext(ctx, 'full');
        if (isDev) console.log(`[getFinancialAdvice] Prepared prompt (${prompt.length} chars), requesting AI advice`);
        
        const aiResponse = await aiClient.send([{ role: 'system', content: prompt }]);
        if (isDev) console.log(`[getFinancialAdvice] Received AI response (${aiResponse.length} chars)`);

        return res.json({ advice: aiResponse, context: ctx });
    } catch (err) {
        console.error(`[getFinancialAdvice] Error:`, err);
        next(err);
    }
};



exports.getUserAccountInfo = async (req, res, next) => {
    try {
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
            if (isDev) console.log(`[getUserAccountInfo] Fetching account info for user: ${userId}`);
        } catch (authError) {
            console.error(`[getUserAccountInfo] Authentication error:`, authError.message);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
            
        // Fetch comprehensive user context
        const ctx = await contextService.getContext(userId);
        if (isDev) console.log(`[getUserAccountInfo] Data retrieved: budgets=${ctx.budgets?.length || 0}, wallets=${ctx.wallets?.length || 0}`);
            
        // Enhance all data for client-side consumption
        await contextEnhancementService.enhanceContextData(ctx, userId, {
            isBudgetQuery: true, 
            isBalanceQuery: true, 
            isSavingsQuery: true, 
            isBillQuery: true
        });
            
        if (isDev) console.log(`[getUserAccountInfo] Enhanced data complete, returning to client`);
        return res.json({ context: ctx });
    } catch (err) {
        console.error(`[getUserAccountInfo] Error:`, err);
        next(err);
    }
};

exports.getContextSuggestions = async (req, res, next) => {
    try {
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
            if (isDev) console.log(`[getContextSuggestions] Generating suggestions for user: ${userId}`);
        } catch (authError) {
            console.error(`[getContextSuggestions] Authentication error:`, authError.message);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
        
        // Fetch comprehensive context
        const ctx = await contextService.getContext(userId);
        if (isDev) console.log(`[getContextSuggestions] Context loaded with ${ctx.budgets?.length || 0} budgets, ${ctx.wallets?.length || 0} wallets`);
        
        if (!ctx.recentTransactions?.length) {
            if (isDev) console.log(`[getContextSuggestions] No transaction history available`);
            return res.json({ suggestions: { generalAdvice: [
                "We need more transaction history to provide personalized suggestions."
            ] } });
        }
        
        // Enhance data to ensure accurate suggestions
        await contextEnhancementService.enhanceContextData(ctx, userId, {
            isBudgetQuery: true, 
            isBalanceQuery: true,
            isSavingsQuery: true,
            isBillQuery: false // Skip bill processing for suggestions
        });
        
        // Generate personalized suggestions based on enhanced data
        const suggestions = await contextService.generateContextSuggestions(ctx);
        if (isDev) console.log(`[getContextSuggestions] Generated ${Object.keys(suggestions).length} suggestion categories`);
        
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
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
            if (isDev) console.log(`[getUserContext] Fetching raw context for user: ${userId}`);
        } catch (authError) {
            console.error(`[getUserContext] Authentication error:`, authError.message);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
        
        // Get raw context without enhancements for diagnostics/debugging
        const ctx = await contextService.getContext(userId);
        
        if (isDev) console.log(`[getUserContext] Retrieved data overview: 
            Budgets: ${ctx.budgets?.length || 0}
            Wallets: ${ctx.wallets?.length || 0}
            Transactions: ${ctx.recentTransactions?.length || 0}
            Categories: ${ctx.categories?.length || 0}
            SavingsGoals: ${ctx.savingsGoals?.length || 0}`);
        
        // If data is missing, log additional diagnostics
        if (!ctx.budgets || ctx.budgets.length === 0) {
            if (isDev) console.log(`[getUserContext] WARNING: No budgets found for user ${userId}`);
            // Direct database check
            const Budget = require('../models/Budget');
            const directCount = await Budget.countDocuments({ userId });
            if (isDev) console.log(`[getUserContext] Direct DB check: found ${directCount} budgets in database`);  
        }
        
        return res.json(ctx);
    } catch (err) {
        console.error('[getUserContext] Error:', err);
        next(err);
    }
};

// Stub function for proactive insights (to be implemented)
exports.getProactiveInsights = async (req, res, next) => {
    try {
        let userId;
        try {
            userId = getAuthenticatedUserId(req);
        } catch (authError) {
            console.error('[getProactiveInsights] Authentication error:', authError.message);
            return res.status(authError.status || 401).json({ 
                error: authError.message, 
                code: 'AUTHENTICATION_ERROR'
            });
        }
        const ctx = await contextService.getContext(userId);
        
        // Generate proactive insights based on user data
        const insights = [];
        
        // Check for low wallet balances
        if (ctx.wallets && ctx.wallets.length > 0) {
            ctx.wallets.forEach(wallet => {
                if (wallet.balance < 100) {
                    insights.push({
                        type: 'warning',
                        title: 'Low Balance Alert',
                        message: `Your ${wallet.name} wallet has a low balance of $${wallet.balance}`,
                        priority: 'high'
                    });
                }
            });
        }
        
        // Check for budget overruns
        if (ctx.budgets && ctx.budgets.length > 0) {
            ctx.budgets.forEach(budget => {
                if (budget.spent && budget.limit && budget.spent > budget.limit * 0.8) {
                    insights.push({
                        type: 'alert',
                        title: 'Budget Warning',
                        message: `You've spent ${(budget.spent / budget.limit * 100).toFixed(0)}% of your ${budget.name} budget`,
                        priority: 'medium'
                    });
                }
            });
        }
        
        // Add general tips if no specific insights
        if (insights.length === 0) {
            insights.push({
                type: 'tip',
                title: 'Financial Tip',
                message: 'Consider setting up automatic savings to build your emergency fund',
                priority: 'low'
            });
        }
        
        return res.json({ insights, context: ctx });
    } catch (err) {
        console.error('[getProactiveInsights] Error:', err);
        next(err);
    }
};

// Stub function for health metrics (to be implemented)
exports.getHealthMetrics = async (req, res, next) => {
    try {
        // Return basic health status
        const healthMetrics = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                aiService: 'available'
            },
            metrics: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                version: process.version
            }
        };
        
        return res.json(healthMetrics);
    } catch (err) {
        console.error('[getHealthMetrics] Error:', err);
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
    getHealthMetrics: exports.getHealthMetrics,
    calculateNetWorth: financialAnalyzerService.calculateNetWorth,
    findRecurringTransactionsAndDueDates: financialAnalyzerService.findRecurringTransactionsAndDueDates,
    findUpcomingBills: financialAnalyzerService.findUpcomingBills
};

