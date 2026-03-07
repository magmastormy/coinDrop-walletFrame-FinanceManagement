import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/authContext';
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

    const quickPrompts = useMemo(() => {
        if (!contextSuggestions) return [];

        const options = [
            ...(contextSuggestions.generalAdvice || []),
            ...(contextSuggestions.spendingInsights || []),
            ...(contextSuggestions.savingsRecommendations || [])
        ];

        return options
            .filter(Boolean)
            .slice(0, 4)
            .map(text => text.length > 80 ? `${text.slice(0, 80)}...` : text);
    }, [contextSuggestions]);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-8">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">AI Finance Assistant</h1>
                        <p className="text-sm text-muted-foreground">Ask about spending, budgets, savings, and trends in your account data.</p>
                    </div>
                    {quickPrompts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={`${prompt}-${idx}`}
                                    type="button"
                                    onClick={() => handleSendMessage(prompt)}
                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-white/20"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
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

