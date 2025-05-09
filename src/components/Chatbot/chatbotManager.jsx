import React, { useState, useEffect, useRef } from 'react';
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
    const initialFetchDone = useRef(false);

    // Fetch context suggestions on mount and user change
    useEffect(() => {
        const fetchInitialContext = async () => {
            if (!user?.id || initialFetchDone.current) return;
            
            try {
                initialFetchDone.current = true;
                const suggestions = await zhipuaiModelService.getContextAwareSuggestions(user.id);
                console.log('||-> ChatbotManager: Initial suggestions fetched', suggestions);
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
                    console.log('=||-> ChatbotManager: Checking for proactive insights');
                    const insights = await zhipuaiModelService.getProactiveInsights(user.id);
                    console.log('=||-> ChatbotManager: Insights received', insights);
                    
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
            console.log('=||-> ChatbotManager: Sending message:', message);
            console.log('=||-> ChatbotManager: User auth info:', { 
                authenticated: !!user, 
                userId: user?.id || 'not available',
            });
            
            setLoading(true);
            setError(null);
            
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Send message to backend, which will handle context fetching and AI response
            console.log('ChatbotManager: Sending message to backend');
            const chatResponse = await zhipuaiModelService.sendMessage([...messages, userMessage]);
            const response = chatResponse.response;

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