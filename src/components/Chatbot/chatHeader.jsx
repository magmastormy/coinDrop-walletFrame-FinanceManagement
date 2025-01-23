// chatHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory } from '@fortawesome/free-solid-svg-icons';
import './styles/chatHeaderStyles.css';

const ChatHeader = ({ onToggleHistory, showHistory }) => {
    return (
        <div className="chat-header">
            <div className="header-title">
                <h3>CoinDrip AI Assistant</h3>
                <span className="status-indicator">Online</span>
            </div>
            <div className="header-actions">
                <button 
                    className={`header-button ${showHistory ? 'active' : ''}`}
                    onClick={onToggleHistory}
                    title="Chat History"
                >
                    <FontAwesomeIcon icon={faHistory} />
                </button>
                <button 
                    className="header-button"
                    title="Settings"
                >
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
