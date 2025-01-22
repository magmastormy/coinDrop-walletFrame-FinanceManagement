import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatInput = ({ onSubmit, isLoading }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(message);
        setMessage('');
    };

    return (
        <form onSubmit={handleSubmit} className="chat-input">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
            />
            <button 
                type="submit" 
                disabled={isLoading}
                className="send-btn"
            >
                <FontAwesomeIcon icon={faPaperPlane} />
            </button>
        </form>
    );
};

export default ChatInput;