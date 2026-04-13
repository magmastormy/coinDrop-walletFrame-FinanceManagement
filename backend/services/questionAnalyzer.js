/**
 * Question Analyzer Service
 * 
 * Analyzes user questions to identify multi-part queries and specific data requests
 * to enhance AI response quality and accuracy.
 */
const logger = require('../utils/logger');
const { performance } = require('perf_hooks');

/**
 * Analyzes a user question to identify specific data requests and query components
 * @param {String} userMessage - The user's message/question
 * @returns {Object} Analysis results including query types and specific data requests
 */
function analyzeQuestion(userMessage) {
    const t0 = performance.now();
    const message = userMessage.toLowerCase();
    
    // Initialize analysis object
    const analysis = {
        isMultiPart: false,
        parts: [],
        specificDataRequests: {
            lastTransaction: false,
            specificTransaction: false,
            transactionByCategory: false,
            transactionByDate: false,
            specificBudget: false,
            specificWallet: false,
            savingsGoals: false,
            savingsAdvice: false,
            financialPlanning: false,
            recommendations: false,
            comparisons: false,
            unnecessaryExpensesAdvice: false,
            generalFinancialAdvice: false,
            budgetAdvice: false,
            investmentAdvice: false
        },
        entities: {
            categories: [],
            dates: [],
            amounts: [],
            wallets: []
        }
    };
    
    // Check for multi-part questions (separated by conjunctions or punctuation)
    // More sophisticated detection to avoid false positives
    const questionParts = message.split(/(?:[?]|\band\b|\bor\b|\balso\b|\bthen\b|\bplus\b)/);
    const filteredParts = questionParts.map(part => part.trim()).filter(part => part.length > 3);
    
        
        // Only consider it multi-part if we have meaningful parts
        if (filteredParts.length > 1) {
            // Further check - look for actual question patterns in each part
            const questionPatterns = filteredParts.filter(part => 
                /\b(what|when|where|which|who|why|how|can|could|would|should|is|are|do|does|did|will|tell me|show me|explain|describe|list|find|get)\b/i.test(part));
            
            if (questionPatterns.length > 1) {
                analysis.isMultiPart = true;
                analysis.parts = questionPatterns;
            }
        }
        
        // Detect specific data requests
        // Last Transaction: Expanded terms for "last" and "transaction", and common phrasings.
        analysis.specificDataRequests.lastTransaction = 
            /\b(last|previous|recent|latest|most recent|we last)\b.{0,35}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|spend|spending|charge|charges|debit|debits|outgoing|outgoings|did|made|incurred|activity|record)\b/i.test(message) ||
            /\b(tell me about|show me|list|give me|what was|what were|find|get|display|view|see).{0,35}\b(my last|my recent|the latest|my previous|most recent)\b.{0,25}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|record)\b/i.test(message) ||
            /\b(tell|show|list|give|display|find|get|view|see).{0,35}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|record)\b/i.test(message);
    analysis.specificDataRequests.lastTransaction = 
        /\b(last|previous|recent|latest|most recent|we last)\b.{0,35}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|spend|spending|charge|charges|debit|debits|outgoing|outgoings|did|made|incurred|activity|record)\b/i.test(message) ||
        /\b(tell me about|show me|list|give me|what was|what were|find|get|display|view|see).{0,35}\b(my last|my recent|the latest|my previous|most recent)\b.{0,25}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|record)\b/i.test(message) ||
        /\b(tell|show|list|give|display|find|get|view|see).{0,35}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|record)\b/i.test(message);

    // Specific Transaction: Expanded terms for identifying a particular transaction.
    analysis.specificDataRequests.specificTransaction =
        /\b(specific|particular|certain|\d+|transaction id|order number|reference number|confirmation number)\b.{0,35}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|record)\b/i.test(message) ||
        /\b(details of|look up|find|get|show me|information on|info on|about the|about that)\b.{0,25}\b(a specific|a particular|that|the|one)\b.{0,25}\b(transaction|transactions|expense|expenses|purchase|purchases|payment|payments|charge|charges|debit|debits|record)\b/i.test(message);

    // Transaction by Category: Expanded terms for transactions linked to categories, and more categories.
    analysis.specificDataRequests.transactionByCategory =
        /\b(transaction|transactions|expense|expenses|spend|spending|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|records)\b.{0,35}\b(by category|by type|in|on|for|related to|under the category of)\b.{0,25}\b(category|categories|type|types|food|groceries|dining|restaurant|takeaway|entertainment|movies|concerts|games|apps|transport|transportation|fuel|gas|public transport|rideshare|taxi|utilities|electricity|water|internet|phone|mobile|rent|mortgage|housing|shopping|retail|online shopping|clothes|apparel|travel|flights|hotels|vacation|trips|health|medical|doctor|pharmacy|dentist|education|tuition|books|courses|study|bills|services|streaming services|subscriptions|fees|gifts|presents|donations|charity|insurance|life insurance|health insurance|car insurance|home insurance|clothing|apparel|shoes|accessories|electronics|gadgets|software|tech|home improvement|decor|furniture|maintenance|repairs|personal care|beauty|haircut|salon|gym|fitness|wellness|pets|pet food|vet|supplies|business|work|office supplies)\b/i.test(message) ||
        /\b(how much did I spend on|show my spending for|list expenses for|what were my charges for|total spent on)\b.{0,25}\b(food|groceries|dining|entertainment|transport|utilities|rent|shopping|travel|health|education|bills|services|subscriptions|gifts|donations|insurance|clothing|electronics|home improvement|personal care|pets|business)\b/i.test(message);

    // Transaction by Date: Expanded terms for transactions linked to dates/timeframes.
    analysis.specificDataRequests.transactionByDate =
        /\b(transaction|transactions|expense|expenses|spend|spending|purchase|purchases|payment|payments|charge|charges|debit|debits|outgoing|outgoings|activity|records)\b.{0,35}\b(by date|on date|for date|during|in|on|from|between|for the period|since|until)\b.{0,25}\b(date|day|month|year|week|yesterday|today|tonight|tomorrow|last week|this week|next week|last month|this month|next month|last year|this year|next year|quarter|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{4}-\d{2}-\d{2}|specific date|timeframe|period)\b/i.test(message) ||
        /\b(show me|list|what were my|find|get)\b.{0,25}\b(transactions|expenses|spending|purchases|payments|charges)\b.{0,25}\b(on|for|during|in|from|between|since|until)\b.{0,25}\b(yesterday|today|last week|this month|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{4}-\d{2}-\d{2}|the \d{1,2}(st|nd|rd|th)|last \d+ days|past month)\b/i.test(message);
    
    // General transaction request detection (catches more general requests for transaction info)
    // This is a fallback if other specific transaction intents are not matched.
    if (/\b(transaction|transactions|expenses|purchases|payments|spending|charges|debits|outgoings|activity|records)\b/i.test(message) &&
        !analysis.specificDataRequests.specificTransaction &&
        !analysis.specificDataRequests.transactionByCategory &&
        !analysis.specificDataRequests.transactionByDate &&
        !analysis.specificDataRequests.lastTransaction) { // Check if lastTransaction isn't already strongly matched
        analysis.specificDataRequests.lastTransaction = true; // Default to last transaction if general
    }
    // Enhanced budget detection - catch both specific and general budget queries
    analysis.specificDataRequests.specificBudget =
        /\b(budget|budgets|spending plan|allowance|limit|limits)\b/i.test(message) ||
        /\b(do i have|what is|my|any|all|check|view|show me|tell me about|how much is left in my|am I over\/under)\b.{0,30}\b(budget|budgets|spending plan|allowance|limit|limits)\b/i.test(message) ||
        /\b(budget|spending plan|allowance|limit).{0,35}\b(for|on|in|related to|allocated to)\b.{0,25}\b(category|categories|food|groceries|dining|entertainment|transport|utilities|rent|shopping|travel|health|education|bills|services|subscriptions|gifts|clothing|personal care|pets|miscellaneous)\b/i.test(message) ||
        /\b(how much can I spend on|what's my budget for|am I within budget for|set a budget for|create a budget for|update budget for)\b.{0,25}\b(food|groceries|dining|entertainment|transport|utilities|rent|shopping|travel|health|education|bills|services|subscriptions|gifts|clothing|personal care|pets|miscellaneous)\b/i.test(message);
    
    // Enhanced savings goals detection
    analysis.specificDataRequests.savingsGoals =
        /\b(saving|savings|save up|goal|goals|target|targets|objective|objectives|ambition|ambitions|fund|funds)\b/i.test(message) ||
        /\b(do i have|what is|my|any|all|check|view|show me|tell me about|progress on|how am I doing with|status of|update on)\b.{0,30}\b(saving|savings|goal|goals|target|targets|fund)\b/i.test(message) ||
        /\b(track|update|set|create|modify|add to|contribute to|reach|achieve)\b.{0,25}\b(saving|savings|goal|goals|target|fund)\b/i.test(message);
    
    // Savings advice detection
    analysis.specificDataRequests.savingsAdvice =
        /\b(how|should|can|could|ways|tips|advice|strategies|help me|guide me|recommendations|suggestions|ideas|best way)\b.{0,40}\b(to save|save|saving|savings|save up|put away|set aside|accumulate|build up|grow|increase)\b.{0,25}\b(money|funds|income|effectively|efficiently|better|more|faster)?\b/i.test(message) ||
        /\b(save|saving|savings).{0,40}\b(more|better|effectively|efficiently|money|income|strategies|tips|advice|plan|guide)\b/i.test(message) ||
        /\b(need help with|want to improve my|looking for ideas on|get better at)\b.{0,25}\b(saving|savings|building savings)\b/i.test(message);
    
    // Financial planning detection
    analysis.specificDataRequests.financialPlanning =
        /\b(plan|planning|future|long-term|long term|retirement|invest|investing|investment|investments|portfolio|assets|wealth management|financial goals|estate planning|financial strategy|financial health|financial future)\b/i.test(message) ||
        /\b(financial|money|budget|investment|wealth|retirement|asset).{0,35}\b(plan|planning|strategy|management|advice|guidance|outlook|goals|consultation)\b/i.test(message) ||
        /\b(help me plan for|how to invest for|strategies for|prepare for|secure my)\b.{0,25}\b(the future|retirement|long-term growth|my financial goals|financial security)\b/i.test(message);
    
    analysis.specificDataRequests.specificWallet =
        /\b(wallet|account|card|bank|checking|savings account|current account|balance|funds|money available)\b.{0,35}\b(balance|amount|money|funds|available|details|status|overview|how much|what's in|value)\b/i.test(message) ||
        /\b(how much is in my|what's in my|check my|show my|tell me my|current|available)\b.{0,25}\b(wallet|account|card|bank|checking|savings account|current account|balance|funds)\b.{0,25}\b(balance|amount|money|funds)?\b/i.test(message);
    analysis.specificDataRequests.recommendations = /\b(recommend|suggest|advice|advise|help|improve|optimize)\b/i.test(message);
    analysis.specificDataRequests.comparisons = /\b(compare|comparison|versus|vs|difference|better|worse|more|less)\b/i.test(message);
    
    // Extract potential entities
    // Categories
    const categoryMatches = message.match(/\b(food|groceries|dining|entertainment|transport|utilities|rent|subscription|stationary)\b/gi);
    if (categoryMatches) {
        analysis.entities.categories = [...new Set(categoryMatches.map(match => match.toLowerCase()))];
    }
    
    // Simple date extraction (could be expanded with a date parsing library)
    const dateMatches = message.match(/\b(yesterday|today|last week|last month|this month|this week)\b/gi);
    if (dateMatches) {
        analysis.entities.dates = [...new Set(dateMatches.map(match => match.toLowerCase()))];
    }
    
    // Detect recommendations about unnecessary expenses
    if (/\b(unnecessary|non-essential|frivolous|waste|wasted|useless|avoidable|cut|reduce|trim|minimize|eliminate|stop|curb|limit|control)\b.{0,40}\b(expense|expenses|spending|cost|costs|outgoings|charges|payments|purchases|habits)\b/i.test(message) ||
        /\b(stop wasting money on|how to cut back on|reduce my spending on)\b/i.test(message)) {
        analysis.specificDataRequests.recommendations = true;
        analysis.specificDataRequests.unnecessaryExpensesAdvice = true;
    }
    
    // Detect financial advice requests (more general and specific types)
    if (/\b(how|what|should|could|would|can|ways|tips|advice|help|strategies|guidance|recommendations|suggestions|best way|need to|want to)\b.{0,40}\b(to manage|manage|improve|optimize|handle|deal with|approach|plan|organize|control|track|understand|get better at)?\b.{0,25}\b(my money|my finances|my financial situation|my budget|my spending|my savings|my investments|my debt|save|saving|savings|budget|budgeting|money|finance|financial|spend|spending|invest|investing|debt management|financial literacy|financial wellness)\b/i.test(message)) {
        analysis.specificDataRequests.recommendations = true; // General recommendation flag
        analysis.specificDataRequests.generalFinancialAdvice = true; // More specific flag

        // If it's specifically about saving, mark it as savings advice
        if (/\b(save|saving|savings|save up|put away|set aside|build savings)\b/i.test(message)) {
            analysis.specificDataRequests.savingsAdvice = true;
        }
        // If it's specifically about budgeting
        if (/\b(budget|budgeting|spending plan|create a budget|stick to a budget)\b/i.test(message)) {
            analysis.specificDataRequests.budgetAdvice = true;
        }
        // If it's specifically about investing
        if (/\b(invest|investing|investment|portfolio|stocks|bonds|mutual funds)\b/i.test(message)) {
            analysis.specificDataRequests.investmentAdvice = true;
        }
    }
    
    logger.log(`[questionAnalyzer] Analysis completed in ${(performance.now() - t0).toFixed(1)}ms`);
    return analysis;
}

/**
 * Generates additional context sections based on question analysis
 * @param {Object} analysis - The question analysis results
 * @param {Object} ctx - The user's financial context
 * @returns {Object} Additional context sections to include
 */
function generateAdditionalContext(analysis, ctx) {
    const additionalContext = [];
    
    // Add specific transaction data if requested
    if (analysis.specificDataRequests.lastTransaction && ctx.recentTransactions && ctx.recentTransactions.length > 0) {
        const lastTransaction = [...ctx.recentTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (lastTransaction) {
            additionalContext.push(
                '## LAST TRANSACTION DETAILS',
                `Description: ${lastTransaction.description || 'No description'}`,
                `Amount: $${Math.abs(lastTransaction.amount).toFixed(2)}`,
                `Type: ${lastTransaction.type || 'Unknown'}`,
                `Category: ${lastTransaction.category?.name || 'Uncategorized'}`,
                `Date: ${new Date(lastTransaction.date).toLocaleDateString()}`,
                `Wallet: ${lastTransaction.wallet?.name || 'Unknown wallet'}`
            );
        }
    }
    
    // Add category-specific transaction data
    if (analysis.specificDataRequests.transactionByCategory && 
        analysis.entities.categories.length > 0 && 
        ctx.recentTransactions && 
        ctx.recentTransactions.length > 0) {
        
        analysis.entities.categories.forEach(category => {
            const categoryTransactions = ctx.recentTransactions.filter(t => 
                t.category?.name?.toLowerCase() === category ||
                (t.category?.name && t.category.name.toLowerCase().includes(category))
            );
            
            if (categoryTransactions.length > 0) {
                additionalContext.push(
                    `## TRANSACTIONS IN CATEGORY: ${category.toUpperCase()}`,
                    ...categoryTransactions.slice(0, 5).map(t => 
                        `- ${t.description || 'No description'}: $${Math.abs(t.amount).toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`
                    )
                );
            }
        });
    }
    
    // Add unnecessary expense analysis if requested
    if (analysis.specificDataRequests.recommendations || analysis.specificDataRequests.unnecessaryExpensesAdvice) {
        // Find categories with highest spending
        if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
            const categorySpending = {};
            ctx.recentTransactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const catName = t.category?.name || 'Uncategorized';
                    if (!categorySpending[catName]) categorySpending[catName] = 0;
                    categorySpending[catName] += Math.abs(t.amount);
                });
            
            // Sort categories by spending
            const sortedCategories = Object.entries(categorySpending)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            if (sortedCategories.length > 0) {
                additionalContext.push(
                    '## HIGHEST SPENDING CATEGORIES',
                    ...sortedCategories.map(([category, amount]) => 
                        `- ${category}: $${amount.toFixed(2)}`
                    )
                );
            }
        }
    }
    
    return additionalContext.join('\n');
}

/**
 * Enhances the AI prompt based on question analysis
 * @param {String} basePrompt - The original AI prompt
 * @param {Object} analysis - The question analysis results
 * @returns {String} Enhanced prompt with additional instructions
 */
function enhancePrompt(basePrompt, analysis) {
    let enhancedPrompt = basePrompt;
    
    // Add specific instructions based on analysis
    const additionalInstructions = [];
    
    if (analysis.isMultiPart) {
        additionalInstructions.push(
            '7. This is a multi-part question. Make sure to address EACH part of the question separately and clearly.',
            `8. The question has ${analysis.parts.length} parts: ${analysis.parts.map((p, i) => `(${i+1}) "${p}"`).join(', ')}`
        );
    }
    
    if (analysis.specificDataRequests.lastTransaction) {
        additionalInstructions.push(
            '9. The user is specifically asking about their last transaction. Make sure to provide these details prominently in your response.'
        );
    }
    
    if (analysis.specificDataRequests.recommendations) {
        additionalInstructions.push(
            '10. The user is asking for recommendations. Provide personalized advice based on their financial data.'
        );
    }
    
    if (analysis.specificDataRequests.unnecessaryExpensesAdvice) {
        additionalInstructions.push(
            '11. The user is asking for recommendations about unnecessary expenses. Analyze their spending patterns and suggest specific areas where they might reduce spending.'
        );
    }
    
    if (analysis.specificDataRequests.savingsAdvice) {
        additionalInstructions.push(
            '12. The user is asking for savings advice. Provide specific strategies to help them save more effectively based on their current financial situation.'
        );
    }
    
    if (analysis.specificDataRequests.budgetAdvice) {
        additionalInstructions.push(
            '13. The user is asking for budgeting advice. Suggest practical budgeting strategies based on their spending patterns.'
        );
    }
    
    if (analysis.specificDataRequests.investmentAdvice) {
        additionalInstructions.push(
            '14. The user is asking for investment advice. Provide general investment principles and strategies (without specific investment recommendations).'
        );
    }
    
    if (additionalInstructions.length > 0) {
        // Find where the additional instructions section ends
        const instructionsEndIndex = enhancedPrompt.indexOf('6. You can reference external');
        if (instructionsEndIndex !== -1) {
            // Insert our new instructions after the existing ones
            const insertPosition = enhancedPrompt.indexOf('\n', instructionsEndIndex) + 1;
            enhancedPrompt = 
                enhancedPrompt.substring(0, insertPosition) + 
                additionalInstructions.join('\n') + 
                '\n' + 
                enhancedPrompt.substring(insertPosition);
        } else {
            // Append to the end if we can't find the insertion point
            enhancedPrompt += '\n\n' + additionalInstructions.join('\n');
        }
    }
    
    return enhancedPrompt;
}

module.exports = {
    analyzeQuestion,
    generateAdditionalContext,
    enhancePrompt
};
