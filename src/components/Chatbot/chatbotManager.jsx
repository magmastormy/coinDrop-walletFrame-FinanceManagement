import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatContainer from './ChatContainer';
import zhipuaiModelService from '../../services/zhipuaiModelService';
import './styles/chatbotManagerStyles.css';

const ChatbotManager = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const handleSendMessage = async (message) => {
        try {
            setLoading(true);
            setError(null);
            
            // Add user message
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            // Update messages immediately with user's message
            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Check if it's a financial query
            const isFinancialQuery = message.toLowerCase().includes('finance') || 
                                   message.toLowerCase().includes('money') ||
                                   message.toLowerCase().includes('budget') ||
                                   message.toLowerCase().includes('spend') ||
                                   message.toLowerCase().includes('saving');

            let response;
            if (isFinancialQuery) {
                // Get financial advice
                const advice = await zhipuaiModelService.getFinancialAdvice();
                response = { response: advice };
            } else {
                // Regular chat response
                response = await zhipuaiModelService.sendMessage([...messages, userMessage]);
            }

            if (!response || !response.response) {
                throw new Error('Invalid response from AI service');
            }

            // Add AI response
            const botResponse = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString()
            };

            // Update messages with AI response
            setMessages(prevMessages => [...prevMessages, botResponse]);

        } catch (error) {
            console.error('Failed to send message:', error);
            setError(error.message);
            
            // Add error message to chat
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-manager">
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