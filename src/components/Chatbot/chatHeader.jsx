// chatHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import './styles/chatHeaderStyles.css';

const ChatHeader = ({ title = "Financial Assistant" }) => {
    return (
        <div className="chat-header">
            <div className="chat-header-avatar">
                <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className="chat-header-info">
                <h2>{title}</h2>
                <p>Ask me about your finances</p>
            </div>
            <div className="chat-header-actions">
                <FontAwesomeIcon icon={faCommentAlt} />
            </div>
        </div>
    );
};

export default ChatHeader;
