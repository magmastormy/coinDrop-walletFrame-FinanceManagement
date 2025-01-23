import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './styles/chatHeaderStyles.css';

const ChatHeader = ({ onClearChat }) => {
    return (
        <div className="chat-header">
            <h3>CoinDrip AI Assistant</h3>
            <div className="header-actions">
                <button onClick={onClearChat} className="clear-btn">Clear</button>
                <button className="close-btn">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
