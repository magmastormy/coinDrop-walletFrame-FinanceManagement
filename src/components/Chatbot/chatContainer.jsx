import React, { useState } from 'react';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import ChatHeader from './chatHeader';
import './styles/chatContainerStyles.css';

const ChatContainer = ({ messages, onSendMessage, onInsightAction, loading, error }) => {
    const [activeInsight, setActiveInsight] = useState(null);
    
    const handleSendMessage = (message) => {
        if (onSendMessage && typeof onSendMessage === 'function') {
            onSendMessage(message);
        }
    };
    
    const handleInsightAction = (insightId, action, insightData) => {
        setActiveInsight(action === 'view-details' ? insightData : null);
        
        if (onInsightAction && typeof onInsightAction === 'function') {
            onInsightAction(insightId, action, insightData);
        }
    };

    return (
        <div className="chat-container">
            <ChatHeader />
            <div className="chat-body">
                <ChatMessages 
                    messages={messages} 
                    onInsightAction={handleInsightAction}
                    activeInsight={activeInsight}
                />
                {error && (
                    <div className="chat-error">
                        <p>{error}</p>
                    </div>
                )}
            </div>
            <ChatInput 
                onSendMessage={handleSendMessage}
                isLoading={loading}
                error={error}
                activeInsight={activeInsight}
            />
        </div>
    );
};

export default ChatContainer;
