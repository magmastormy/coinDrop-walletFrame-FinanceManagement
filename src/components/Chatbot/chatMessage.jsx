import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/chatMessageStyles.css';

const ChatMessage = ({ message, isBot }) => {
    const { theme } = useTheme();

    return (
        <motion.div
            className={`chat-message ${isBot ? 'bot' : 'user'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                backgroundColor: isBot ? theme.background.secondary : theme.button.base,
                color: isBot ? theme.text.primary : 'white'
            }}
        >
            <div 
                className="message-avatar"
                style={{
                    backgroundColor: isBot ? theme.button.base + '20' : 'white',
                    color: isBot ? theme.button.base : theme.button.base
                }}
            >
                <FontAwesomeIcon icon={isBot ? faRobot : faUser} />
            </div>
            <div className="message-content">
                {message}
            </div>
        </motion.div>
    );
};

export default ChatMessage;
