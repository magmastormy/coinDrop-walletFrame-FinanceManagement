import React from 'react';
import './styles/chatMessagesStyles.css';

const ChatMessages = ({ messages = [], error }) => {
    return (
        <div className="chat-messages">
            <div className="messages-container">
                {messages.map((message, index) => (
                    <div 
                        key={`${message.role}-${index}-${message.timestamp}`}
                        className={`message ${message.role}`}
                    >
                        <div className="message-bubble">
                            {message.content}
                        </div>
                    </div>
                ))}
                {error && (
                    <div 
                        className="error-message"
                    >
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessages;