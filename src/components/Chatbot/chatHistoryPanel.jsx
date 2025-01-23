// ChatHistoryPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faSearch } from '@fortawesome/free-solid-svg-icons';
import './styles/chatHistoryPanelStyles.css';

const ChatHistoryPanel = ({ chatHistory }) => {
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const groupByDate = (messages) => {
        const groups = {};
        messages.forEach(message => {
            const date = formatDate(message.timestamp);
            if (!groups[date]) groups[date] = [];
            groups[date].push(message);
        });
        return groups;
    };

    const groupedHistory = groupByDate(chatHistory);

    return (
        <motion.div 
            className="chat-history-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="history-header">
                <h3>Conversation History</h3>
                <div className="history-search">
                    <FontAwesomeIcon icon={faSearch} />
                    <input type="text" placeholder="Search conversations..." />
                </div>
            </div>
            <div className="history-content">
                {Object.entries(groupedHistory).map(([date, messages]) => (
                    <div key={date} className="history-group">
                        <div className="date-divider">
                            <FontAwesomeIcon icon={faCalendar} />
                            <span>{date}</span>
                        </div>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                className="history-message"
                                initial={{ x: -20 }}
                                animate={{ x: 0 }}
                            >
                                <span className="message-role">
                                    {message.role === 'user' ? 'You' : 'AI'}
                                </span>
                                <p>{message.content}</p>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ChatHistoryPanel;