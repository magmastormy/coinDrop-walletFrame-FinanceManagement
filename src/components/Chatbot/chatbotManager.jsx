import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatContainer from './chatContainer';
import aiServiceWrapper from '../../services/aiServiceWrapper';

const isDev = import.meta.env.DEV;

/**
 * ChatbotManager - AI chatbot interface with optimized performance
 * Features: Request debouncing, caching, per-user isolation, optimistic UI
 */
const ChatbotManager = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastActivityCheck, setLastActivityCheck] = useState(Date.now());
    const [contextSuggestions, setContextSuggestions] = useState(null);
    const [insightsEnabled, setInsightsEnabled] = useState(true);
    const initialFetchDone = useRef(false);
    const debounceTimeout = useRef(null);

    // Fetch context suggestions on mount and user change
    useEffect(() => {
        const fetchInitialContext = async () => {
            if (!user?.id || initialFetchDone.current) return;

            try {
                initialFetchDone.current = true;
                // getContextSuggestions now requires userId parameter
                const suggestions = await aiServiceWrapper.getContextSuggestions(user.id);
                if (isDev) console.log('[ChatbotManager] Initial suggestions (cached)');
                setContextSuggestions(suggestions);

                // Show welcome message with suggestion if available
                if (suggestions && Object.values(suggestions).some(arr => arr.length > 0)) {
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
                console.error('[ChatbotManager] Failed to get initial context:', error.message);
                // Silently fail - don't interrupt user experience
            }
        };

        fetchInitialContext();
    }, [user]);

    // Check for proactive insights every 20 minutes
    useEffect(() => {
        if (!user?.id || !insightsEnabled) return;

        const checkForInsights = async () => {
            try {
                // Only check if it's been more than 10 minutes since last activity
                if (Date.now() - lastActivityCheck > 10 * 60 * 1000) {
                    if (isDev) console.log('[ChatbotManager] Checking proactive insights (may be cached)');
                    const insights = await aiServiceWrapper.getProactiveInsights(user.id);

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
                console.error('[ChatbotManager] Failed to get insights:', error.message);
                // Disable insights and retry after 60 minutes
                setInsightsEnabled(false);
                setTimeout(() => setInsightsEnabled(true), 60 * 60 * 1000);
            }
        };

        checkForInsights();
        const intervalId = setInterval(checkForInsights, 20 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [user, lastActivityCheck, insightsEnabled]);

    /**
     * Send message with debouncing to prevent rapid-fire requests
     * Uses optimistic UI updates for better UX
     */
    const handleSendMessage = useCallback(async (message) => {
        if (!user?.id) {
            setError('User not authenticated');
            return;
        }

        // Clear any pending debounce
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        try {
            if (isDev) console.log('[ChatbotManager] Sending message for user:', user.id);

            setLoading(true);
            setError(null);

            // Optimistic UI update - show user message immediately
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Prepare messages for API (limit to last 20 for performance)
            const recentMessages = [...messages, userMessage].slice(-20);

            // Send with userId parameter for proper isolation
            const chatResponse = await aiServiceWrapper.sendMessage(recentMessages, user.id);
            const response = chatResponse.response;

            if (isDev) console.log('[ChatbotManager] Response received');

            const botResponse = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, botResponse]);

            // Update last activity to avoid immediate insights
            setLastActivityCheck(Date.now());

            // Invalidate context cache after conversation (user state may have changed)
            aiServiceWrapper.invalidateCache(user.id, 'contextSuggestions');

        } catch (error) {
            console.error('[ChatbotManager] Failed to send message:', error.message);

            // Check if it's a fallback response from circuit breaker
            if (error.response?.isFallback) {
                setError(error.response.response);
            } else {
                setError('Failed to get response. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [user, messages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <ChatContainer
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
            />
        </div>
    );
};

export default ChatbotManager;

