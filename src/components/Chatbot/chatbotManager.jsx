import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatContainer from './chatContainer';
import zhipuaiModelService from '../../services/zhipuaiModelService';
import './styles/chatbotManagerStyles.css';

const ChatbotManager = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Check if it's a financial query
            const isFinancialQuery = message.toLowerCase().includes('finance') || 
                                   message.toLowerCase().includes('money') ||
                                   message.toLowerCase().includes('budget') ||
                                   message.toLowerCase().includes('spend') ||
                                   message.toLowerCase().includes('saving');

            let response;
            if (isFinancialQuery && user?.id) {
                // Get financial advice using user ID
                const advice = await zhipuaiModelService.getFinancialAdvice(user.id);
                response = advice;
            } else {
                // Regular chat response
                const chatResponse = await zhipuaiModelService.sendMessage([...messages, userMessage]);
                response = chatResponse.response;
            }

            // Add AI response
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