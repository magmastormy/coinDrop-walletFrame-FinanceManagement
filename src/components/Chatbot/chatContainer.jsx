import React from 'react';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import ChatHeader from './chatHeader';
import './styles/chatContainerStyles.css';

const ChatContainer = ({ 
    messages, 
    onSendMessage, 
    onInsightAction, 
    loading, 
    error 
}) => {
    return (
        <div className="chat-container">
            <ChatHeader title="Financial Assistant" />
            
            <div className="chat-messages-wrapper">
                <ChatMessages 
                    messages={messages} 
                    onInsightAction={onInsightAction} 
                />
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {loading && (
                    <div className="loading-indicator">
                        <div className="loading-dots">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
            </div>
            
            <ChatInput 
                onSendMessage={onSendMessage} 
                disabled={loading}
                placeholder="Ask about your finances..."
            />
        </div>
    );
};

export default ChatContainer;
