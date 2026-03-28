import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/authContext';
import ChatContainer from './chatContainer';
import ChatInsightsSidebar from './ChatInsightsSidebar';
import MobileBottomNav from './MobileBottomNav';
import aiServiceWrapper from '../../services/aiServiceWrapper';
import './chatbotStyles.css';

const isDev = import.meta.env.DEV;

/**
 * ChatbotManager - AI chatbot interface with Financial Curator design
 * Features: Request debouncing, caching, per-user isolation, optimistic UI
 * Design: Three-column layout with glassmorphism, dark theme, Material Design icons
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
                            content: `Welcome back! ${welcomeInsight}\n\nHow can I help you today?`,
                            timestamp: new Date().toISOString()
                        };

                        setMessages([welcomeMessage]);
                    }
                }
            } catch (_) {
                // Error already handled by service
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
                    const insights = await aiServiceWrapper.getProactiveInsights(user.id);

                    if (insights && insights.length > 0) {
                        const botMessage = {
                            role: 'assistant',
                            content: `Proactive Insight: ${insights[0]}`,
                            timestamp: new Date().toISOString(),
                            type: 'proactive'
                        };
                        setMessages(prevMessages => [...prevMessages, botMessage]);
                    }
                    setLastActivityCheck(Date.now());
                }
            } catch (_) {
                // Error already handled by service
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

            // Debug: Log the actual response structure
            if (isDev) {
                console.log('[ChatbotManager] Raw response:', chatResponse);
                console.log('[ChatbotManager] Response data:', chatResponse?.data);
            }

            // Extract response from axios response structure
            const response =
                chatResponse?.data?.response ||
                chatResponse?.data?.message ||
                chatResponse?.data?.content ||
                chatResponse?.response ||
                chatResponse?.message ||
                chatResponse?.content ||
                (typeof chatResponse === 'string' ? chatResponse : null) ||
                '';

            if (isDev) {
                console.log('[ChatbotManager] Extracted response:', response);
            }

            const botResponse = {
                role: 'assistant',
                content: response || 'Sorry — I could not generate a response. Please try again.',
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, botResponse]);

            // Update last activity to avoid immediate insights
            setLastActivityCheck(Date.now());

            // Invalidate context cache after conversation (user state may have changed)
            aiServiceWrapper.invalidateCache(user.id, 'contextSuggestions');

        } catch (error) {
            // Error already handled by UI

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

    // Handle insight actions (Dismiss, View Details)
    const handleInsightAction = useCallback((index, action, data) => {
        if (action === 'dismiss') {
            // Remove the insight message
            setMessages(prev => prev.filter((_, i) => i !== index));
        } else if (action === 'view-details') {
            // Could open a modal or navigate to detailed view
            if (isDev) console.log('[ChatbotManager] View details:', data);
        }
    }, []);

    // Clear all messages
    const handleClearThread = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);

    // Extract quick prompts from context suggestions
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
        <div className="flex h-full -m-8 overflow-hidden bg-surface">
            {/* Main Chat Canvas */}
            <main className="flex-1 flex overflow-hidden relative">
                <ChatContainer
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onInsightAction={handleInsightAction}
                    onClearThread={handleClearThread}
                    loading={loading}
                    error={error}
                    quickPrompts={quickPrompts}
                />
            </main>

            {/* Secondary Insights Sidebar - Hidden on smaller screens */}
            <ChatInsightsSidebar />

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
};

export default ChatbotManager;
