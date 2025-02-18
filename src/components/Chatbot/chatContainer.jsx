import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../theme/ThemeContext';
import ChatMessage from './chatMessage';
import ChatInput from './chatInput';
import './styles/chatContainerStyles.css';

const ChatContainer = ({ messages, onSendMessage, isLoading }) => {
    const { theme } = useTheme();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <motion.div 
            className="chat-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                backgroundColor: theme.background.primary,
                borderColor: theme.button.base + '20'
            }}
        >
            <div 
                className="chat-header"
                style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.button.base + '20'
                }}
            >
                <h2 style={{ color: theme.text.primary }}>AI Assistant</h2>
                <p style={{ color: theme.text.secondary }}>Ask me anything about your finances</p>
            </div>

            <div className="messages-container">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <ChatMessage
                            key={index}
                            message={msg.content}
                            isBot={msg.isBot}
                        />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </motion.div>
    );
};

export default ChatContainer;
