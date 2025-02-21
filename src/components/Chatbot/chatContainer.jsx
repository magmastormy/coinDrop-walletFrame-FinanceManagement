import React from 'react';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import './styles/chatContainerStyles.css';

const ChatContainer = ({ messages, onSendMessage, loading }) => {
    const handleSendMessage = (message) => {
        if (onSendMessage && typeof onSendMessage === 'function') {
            onSendMessage(message);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-header-avatar">
                    <i className="fas fa-robot"></i>
                </div>
                <div className="chat-header-info">
                    <h2>CoinDrip AI Assistant</h2>
                    <p>Ask me about your finances</p>
                </div>
            </div>
            <div className="chat-messages-wrapper">
                <ChatMessages messages={messages} />
            </div>
            <ChatInput 
                onSendMessage={handleSendMessage}
                isLoading={loading}
            />
        </div>
    );
};

export default ChatContainer;
