import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import './styles/chatMessagesStyles.css';

const ChatMessages = ({ chatHistory, error }) => {
    const renderMessage = (message, index) => (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
            {message.role === 'assistant' && (
                <div className="bot-avatar">
                    <FontAwesomeIcon icon={faRobot} />
                </div>
            )}
            <div className="message-bubble">
                <p>{message.content}</p>
                <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </span>
            </div>
        </motion.div>
    );

    return (
        <div className="chat-messages">
            {chatHistory.length === 0 ? (
                <motion.div 
                    className="welcome-message"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <FontAwesomeIcon icon={faRobot} className="welcome-icon" />
                    <h4>Welcome to CoinDrip AI Assistant</h4>
                    <p>How can I help you manage your finances today?</p>
                </motion.div>
            ) : (
                chatHistory.map(renderMessage)
            )}
            {error && (
                <motion.div 
                    className="error-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
};

export default ChatMessages;