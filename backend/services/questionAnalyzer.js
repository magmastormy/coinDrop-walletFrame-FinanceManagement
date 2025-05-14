/**
 * Question Analyzer Service
 * 
 * Analyzes user questions to identify multi-part queries and specific data requests
 * to enhance AI response quality and accuracy.
 */
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
            recommendations: false,
            comparisons: false
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
            /\b(what|when|where|which|who|why|how|can|could|would|should|is|are|do|does|did|will)\b/i.test(part));
        
        if (questionPatterns.length > 1) {
            analysis.isMultiPart = true;
            analysis.parts = questionPatterns;
        }
    }
    
    // Detect specific data requests
    analysis.specificDataRequests.lastTransaction = /\b(last|recent|latest|we last)\b.{0,30}\b(transaction|expense|purchase|payment|spend|spending|did|made)\b/i.test(message) || 
                                               /\b(tell|show|list|give).{0,30}\b(transaction|expense|purchase|payment)\b/i.test(message);
    analysis.specificDataRequests.specificTransaction = /\b(specific|particular|\d+)\b.{0,30}\b(transaction|expense|purchase|payment)\b/i.test(message);
    analysis.specificDataRequests.transactionByCategory = /\b(transaction|expense|spend|spending).{0,30}\b(categor|food|groceries|dining|entertainment|transport|utilities|rent)\b/i.test(message);
    analysis.specificDataRequests.transactionByDate = /\b(transaction|expense|spend|spending).{0,30}\b(date|day|month|week|yesterday|today|last week)\b/i.test(message);
    
    // General transaction request detection (catches more general requests for transaction info)
    if (/\b(transaction|transactions|expenses|purchases|payments)\b/i.test(message)) {
        analysis.specificDataRequests.lastTransaction = true;
    }
    // Enhanced budget detection - catch both specific and general budget queries
    analysis.specificDataRequests.specificBudget = /\b(budget|budgets)\b/i.test(message) || 
                                              /\b(do i have|my|any|all).{0,20}\b(budget|budgets)\b/i.test(message) ||
                                              /\b(budget).{0,30}\b(categor|food|groceries|dining|entertainment|transport|utilities|rent)\b/i.test(message);
    
    // Enhanced savings goals detection
    analysis.specificDataRequests.savingsGoals = /\b(saving|savings|goal|goals)\b/i.test(message) ||
                                             /\b(do i have|my|any|all).{0,20}\b(saving|savings|goal|goals)\b/i.test(message);
    
    analysis.specificDataRequests.specificWallet = /\b(wallet|account).{0,30}\b(balance|amount|money|funds)\b/i.test(message);
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
    if (/\b(unnecessary|waste|wasted|useless|cut|reduce)\b.{0,30}\b(expense|spending|cost)\b/i.test(message)) {
        analysis.specificDataRequests.recommendations = true;
    }
    
    console.log(`[questionAnalyzer] Analysis completed in ${(performance.now() - t0).toFixed(1)}ms`);
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
    if (analysis.specificDataRequests.recommendations) {
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
            '10. The user is asking for recommendations about unnecessary expenses. Analyze their spending patterns and suggest specific areas where they might reduce spending.'
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
