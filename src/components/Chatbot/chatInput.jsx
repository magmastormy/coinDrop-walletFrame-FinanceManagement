import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMicrophone, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './styles/chatInputStyles.css';

const ChatInput = ({ onSubmit, isLoading }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSubmit(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-input-container">
            <form onSubmit={handleSubmit} className="chat-input-form">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    rows={1}
                    className="chat-textarea"
                />
                <div className="input-actions">
                    <button 
                        type="button" 
                        className="action-button voice-button"
                        disabled={isLoading}
                    >
                        <FontAwesomeIcon icon={faMicrophone} />
                    </button>
                    <button 
                        type="submit" 
                        className="action-button send-button"
                        disabled={isLoading || !message.trim()}
                    >
                        <FontAwesomeIcon 
                            icon={isLoading ? faSpinner : faPaperPlane} 
                            className={isLoading ? 'fa-spin' : ''} 
                        />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;