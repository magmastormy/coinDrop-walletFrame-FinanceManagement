import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const ChatMessages = ({ chatHistory, error }) => {
    const renderMessage = (message, index) => (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
            {message.role === 'assistant' && (
                <FontAwesomeIcon icon={faRobot} className="bot-icon" />
            )}
            <div className="message-content">
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
                <div className="welcome-message">
                    <FontAwesomeIcon icon={faRobot} className="welcome-icon" />
                    <h4>Hello! I'm your CoinDrip AI assistant.</h4>
                    <p>How can I help you today?</p>
                </div>
            ) : (
                chatHistory.map(renderMessage)
            )}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ChatMessages;