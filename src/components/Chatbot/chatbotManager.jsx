import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatContainer from './chatContainer';
import zhipuaiModelService from '../../services/zhipuaiModelService';
import './styles/chatbotManagerStyles.css';

const ChatbotManager = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastActivityCheck, setLastActivityCheck] = useState(Date.now());
    const [contextSuggestions, setContextSuggestions] = useState(null);
    const [insightsEnabled, setInsightsEnabled] = useState(true);

    // Fetch context suggestions on mount and user change
    useEffect(() => {
        const fetchInitialContext = async () => {
            if (!user?.id) return;
            
            try {
                console.log('ChatbotManager: Fetching initial context suggestions');
                const suggestions = await zhipuaiModelService.getContextAwareSuggestions(user.id);
                console.log('ChatbotManager: Initial suggestions fetched', suggestions);
                setContextSuggestions(suggestions);
                
                // Show a welcome message with a suggestion if available
                if (suggestions && Object.values(suggestions).some(arr => arr.length > 0)) {
                    // Find first non-empty suggestion
                    let welcomeInsight = '';
                    
                    for (const category of ['generalAdvice', 'spendingInsights', 'savingsRecommendations', 'budgetAdjustments']) {
                        if (suggestions[category] && suggestions[category].length > 0) {
                            welcomeInsight = suggestions[category][0];
                            break;
                        }
                    }
                    
                    if (welcomeInsight) {
                        const welcomeMessage = {
                            role: 'assistant',
                            content: `Welcome back! 💡 ${welcomeInsight}\n\nHow can I help you today?`,
                            timestamp: new Date().toISOString()
                        };
                        
                        setMessages([welcomeMessage]);
                    }
                }
            } catch (error) {
                console.error('Failed to get initial context suggestions:', error);
                // Don't set an error state here, just silently fail
            }
        };
        
        fetchInitialContext();
    }, [user]);

    // Check for proactive insights every 5 minutes
    useEffect(() => {
        if (!user?.id || !insightsEnabled) return;

        const checkForInsights = async () => {
            try {
                // Only check if it's been more than 5 minutes since last activity
                if (Date.now() - lastActivityCheck > 5 * 60 * 1000) {
                    console.log('ChatbotManager: Checking for proactive insights');
                    const insights = await zhipuaiModelService.getProactiveInsights(user.id);
                    console.log('ChatbotManager: Insights received', insights);
                    
                    if (insights && insights.length > 0) {
                        const botMessage = {
                            role: 'assistant',
                            content: `💡 Proactive Insight: ${insights[0]}`,
                            timestamp: new Date().toISOString(),
                            type: 'proactive'
                        };
                        setMessages(prevMessages => [...prevMessages, botMessage]);
                    }
                    setLastActivityCheck(Date.now());
                }
            } catch (error) {
                console.error('Failed to get proactive insights:', error);
                // Temporarily disable insights if there's an error
                setInsightsEnabled(false);
                setTimeout(() => setInsightsEnabled(true), 30 * 60 * 1000); // Try again in 30 minutes
            }
        };

        // Initial check after component mount
        checkForInsights();
        
        const intervalId = setInterval(checkForInsights, 5 * 60 * 1000); // Check every 5 minutes
        return () => clearInterval(intervalId);
    }, [user, lastActivityCheck, insightsEnabled]);

    const handleSendMessage = async (message) => {
        try {
            console.log('ChatbotManager: Sending message:', message);
            setLoading(true);
            setError(null);
            
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Detect different types of financial queries
            const isBalanceQuery = /\b(balance|account|wallet|how much|check balance)\b/i.test(message.toLowerCase());
            const isBudgetQuery = /\b(budgets?|spending|expenses|spent|overspent)\b/i.test(message.toLowerCase());
            const isSavingsQuery = /\b(saving|goal|target|emergency fund|tuition)\b/i.test(message.toLowerCase());
            const isBillQuery = /\b(bills?|payment|due|upcoming|recurring|subscription)\b/i.test(message.toLowerCase());
            const isFinancialQuery = isBalanceQuery || isBudgetQuery || isSavingsQuery || isBillQuery || 
                                     /\b(money|financial|finance|income|automations|transfer)\b/i.test(message.toLowerCase());
            
            // Get context-aware response
            let response;
            if (user?.id) {
                let contextString = 'No financial context available.';
                let accountInfo = null;
                
                // For any financial query, fetch complete account info
                if (isFinancialQuery) {
                    try {
                        accountInfo = await zhipuaiModelService.getUserAccountInfo(user.id);
                        if (accountInfo) {
                            // Create specific context string based on query type
                            if (isBalanceQuery) {
                                const walletsInfo = accountInfo.wallets.map(w => 
                                    `${w.name} (${w.type}): ${w.balance} ${w.currency}`
                                ).join('\n');
                                
                                contextString = `
Here is the user's financial information:
Total Balance: ${accountInfo.totalBalance} ${accountInfo.wallets[0]?.currency || 'USD'}
Individual Wallets:
${walletsInfo}

The user has asked about their balance. Provide a helpful response with the current balance information. Be specific about the individual wallet balances.
`;
                            } 
                            else if (isBudgetQuery) {
                                const budgetsInfo = accountInfo.budgets.map(b => 
                                    `${b.name} (${b.category}): $${b.spent}/$${b.amount} (${b.percentUsed}% used, $${b.remaining} remaining)`
                                ).join('\n');
                                
                                contextString = `
Here is the user's budget information:
${budgetsInfo}

Monthly income: $${accountInfo.financialSummary.monthlyIncome}
Monthly expenses: $${accountInfo.financialSummary.monthlyExpenses}

The user has asked about their budgets. Provide a helpful response focusing on their budget status, highlighting any that are close to or exceeding limits.
`;
                            }
                            else if (isSavingsQuery) {
                                const goalsInfo = accountInfo.savingsGoals.map(g => {
                                    let timeInfo = g.timeRemaining !== null ? 
                                        `${g.timeRemaining} months left, needs $${g.monthlyNeeded?.toFixed(2)}/month` :
                                        'no deadline set';
                                    return `${g.name}: $${g.current}/$${g.target} (${g.progress}% complete, ${timeInfo})`;
                                }).join('\n');
                                
                                const accountsInfo = (accountInfo.savingsAccounts || []).map(a => {
                                    let autoInfo = a.hasAutomation ? 
                                        `automated ${a.automationType} contributions of $${a.nextContribution?.amount?.toFixed(2)} ${a.nextContribution?.frequency}` :
                                        'no automation';
                                    return `${a.name}: $${a.balance} (${autoInfo})`;
                                }).join('\n');
                                
                                contextString = `
Here is the user's savings information:

Savings Goals:
${goalsInfo || 'No savings goals set up'}

Savings Accounts:
${accountsInfo || 'No savings accounts found'}

The user has asked about their savings. Provide a helpful response focusing on their progress toward goals and any automation setups.
`;
                            }
                            else if (isBillQuery) {
                                const billsInfo = (accountInfo.upcomingBills || []).map(b => 
                                    `${b.description || b.category}: $${b.amount} due in ${b.daysUntilDue} days (${new Date(b.nextDueDate).toLocaleDateString()})`
                                ).join('\n');
                                
                                contextString = `
Here is the user's upcoming bill information:
${billsInfo || 'No upcoming bills detected'}

Recurring Transactions:
${accountInfo.recurringTransactions?.map(t => 
    `${t.description || t.category}: $${t.amount} (${t.frequency}, next due: ${new Date(t.nextDueDate).toLocaleDateString()})`
).join('\n') || 'No recurring transactions detected'}

The user has asked about their bills or payments. Provide a helpful response focusing on upcoming payments and due dates.
`;
                            }
                            else {
                                // Comprehensive financial overview for general financial queries
                                contextString = `
Here is the user's complete financial information:

WALLETS & BALANCES:
Total Balance: $${accountInfo.totalBalance}
${accountInfo.wallets.map(w => `${w.name} (${w.type}): $${w.balance}`).join('\n')}

MONTHLY SUMMARY:
Income: $${accountInfo.financialSummary.monthlyIncome}
Expenses: $${accountInfo.financialSummary.monthlyExpenses}
Savings Rate: ${accountInfo.financialSummary.savingsRate.toFixed(1)}%

BUDGETS:
${accountInfo.budgets.map(b => `${b.name}: $${b.spent}/$${b.amount} (${b.percentUsed}% used)`).join('\n') || 'No budgets found'}

SAVINGS GOALS:
${accountInfo.savingsGoals.map(g => `${g.name}: $${g.current}/$${g.target} (${g.progress}%)`).join('\n') || 'No savings goals found'}

UPCOMING BILLS:
${(accountInfo.upcomingBills || []).map(b => `${b.description || b.category}: $${b.amount} due in ${b.daysUntilDue} days`).join('\n') || 'No upcoming bills detected'}

RECENT TRANSACTIONS:
${accountInfo.recentTransactions.slice(0, 3).map(t => `${t.type}: $${t.amount} for ${t.category} on ${new Date(t.date).toLocaleDateString()}`).join('\n')}

The user has asked about their financial situation. Provide a helpful response addressing their specific question based on this data.
`;
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching account info:', error);
                    }
                }
                // For non-financial queries, use the regular context suggestions
                else if (contextSuggestions) {
                    // Refresh context suggestions if needed
                    if (!contextSuggestions) {
                        try {
                            const suggestions = await zhipuaiModelService.getContextAwareSuggestions(user.id);
                            console.log('ChatbotManager: Context suggestions refreshed', suggestions);
                            setContextSuggestions(suggestions);
                        } catch (error) {
                            console.error('Failed to refresh context suggestions:', error);
                            // Continue with existing context or null
                        }
                    }
                    
                    // Format context as a string with key insights
                    // Flatten the suggestions into a single string
                    const allSuggestions = Object.entries(contextSuggestions)
                        .filter(([_, arr]) => arr && arr.length > 0)
                        .map(([category, arr]) => {
                            return `${category}: ${arr.join('. ')}`;
                        })
                        .join('\n\n');
                        
                    if (allSuggestions) {
                        contextString = `Financial context: ${allSuggestions}`;
                    }
                }
                
                console.log('ChatbotManager: Sending message with context');
                
                // Combine context with the user's message for better response
                const chatResponse = await zhipuaiModelService.sendMessage([
                    ...messages,
                    {
                        role: 'system',
                        content: contextString
                    },
                    userMessage
                ]);
                response = chatResponse.response;
            } else {
                // Regular chat response for non-authenticated users
                console.log('ChatbotManager: Sending message without context (user not authenticated)');
                const chatResponse = await zhipuaiModelService.sendMessage([...messages, userMessage]);
                response = chatResponse.response;
            }

            console.log('ChatbotManager: Response received:', response);
            
            const botResponse = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, botResponse]);

            // Update last activity check to avoid showing insights right after a conversation
            setLastActivityCheck(Date.now());

        } catch (error) {
            console.error('Failed to send message:', error);
            setError('Failed to get response from AI. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Function to dismiss/handle proactive insights
    const handleInsightAction = (insightId, action) => {
        // Future enhancement: Handle user actions on insights
        console.log(`User ${action} insight ${insightId}`);
    };

    return (
        <div className="chatbot-wrapper">
            <ChatContainer
                messages={messages}
                onSendMessage={handleSendMessage}
                onInsightAction={handleInsightAction}
                loading={loading}
                error={error}
            />
        </div>
    );
};

export default ChatbotManager;