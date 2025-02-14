// chatHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory, faDatabase } from '@fortawesome/free-solid-svg-icons';
import './styles/chatHeaderStyles.css';

const ChatHeader = ({ onToggleHistory, showHistory, onToggleContext, useContext }) => {
    return (
        <div className="chat-header">
            <div className="header-title">
                <h3>Financial Assistant</h3>
                <div className="context-indicator">
                    {useContext && <span>Using Context</span>}
                </div>
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
                <button 
                    className={`context-button ${useContext ? 'active' : ''}`}
                    onClick={onToggleContext}
                >
                    <FontAwesomeIcon icon={faDatabase} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
