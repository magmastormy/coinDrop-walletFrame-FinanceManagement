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
                <h2>CoinDrip AI Assistant</h2>
            </div>
            <div className="chat-body">
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
