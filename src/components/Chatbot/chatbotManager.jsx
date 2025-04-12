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

    // Check for proactive insights every 5 minutes
    useEffect(() => {
        if (!user?.id) return;

        const checkForInsights = async () => {
            try {
                // Only check if it's been more than 5 minutes since last activity
                if (Date.now() - lastActivityCheck > 5 * 60 * 1000) {
                    const insights = await zhipuaiModelService.getProactiveInsights(user.id);
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
            }
        };

        const intervalId = setInterval(checkForInsights, 5 * 60 * 1000); // Check every 5 minutes
        return () => clearInterval(intervalId);
    }, [user, lastActivityCheck]);

    const handleSendMessage = async (message) => {
        try {
            setLoading(true);
            setError(null);
            
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Get context-aware response
            let response;
            if (user?.id) {
                // Get context-aware suggestions
                const contextSuggestions = await zhipuaiModelService.getContextAwareSuggestions(user.id);
                
                // Combine context with the user's message for better response
                const chatResponse = await zhipuaiModelService.sendMessage([
                    ...messages,
                    {
                        role: 'system',
                        content: `Context: ${JSON.stringify(contextSuggestions)}`,
                    },
                    userMessage
                ]);
                response = chatResponse.response;
            } else {
                // Regular chat response for non-authenticated users
                const chatResponse = await zhipuaiModelService.sendMessage([...messages, userMessage]);
                response = chatResponse.response;
            }

            const botResponse = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            setMessages(prevMessages => [...prevMessages, botResponse]);

        } catch (error) {
            console.error('Failed to send message:', error);
            setError('Failed to get response from AI. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-wrapper">
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