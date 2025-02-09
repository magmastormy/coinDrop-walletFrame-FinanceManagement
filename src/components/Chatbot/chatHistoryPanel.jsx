// ChatHistoryPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';
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
            <h3>Chat History</h3>
            <div className="history-list">
                {Object.keys(groupedHistory).length === 0 ? (
                    <p>No chat history yet.</p>
                ) : (
                    Object.keys(groupedHistory).map(date => (
                        <div key={date}>
                            <h4>{date}</h4>
                            {groupedHistory[date].map((message, index) => (
                                <div key={index} className={`history-item ${message.role}`}>
                                    <p>{message.content}</p>
                                    <span className="timestamp">{formatDate(message.timestamp)}</span>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default ChatHistoryPanel;