// ChatHistoryPanel.js
import React from 'react';
import './styles/chatHistoryPanelStyles.css'; // Create this CSS file

const ChatHistoryPanel = ({ chatHistory }) => {

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // Customize date format as needed
    };

    return (
        <div className="chat-history-panel">
            <h3>Chat History</h3>
            <div className="history-list">
                {chatHistory.length === 0 ? (
                    <p>No chat history yet.</p>
                ) : (
                    chatHistory.map((message, index) => (
                        <div key={index} className="history-item">
                            <div className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
                                <p>{message.content}</p>
                                <span className="timestamp">{formatDate(message.timestamp)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatHistoryPanel;