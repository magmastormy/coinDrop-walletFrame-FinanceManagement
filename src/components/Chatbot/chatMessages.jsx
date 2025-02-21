import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRobot, faChartLine } from '@fortawesome/free-solid-svg-icons';
import './styles/chatMessagesStyles.css';

const ChatMessage = ({ message }) => {
    const { role, content, timestamp } = message;
    const isUser = role === 'user';
    const isFinancialAdvice = content.includes('Analysis of Spending Patterns') || 
                             content.includes('Specific Areas of Concern') ||
                             content.includes('Actionable Recommendations');

    const formatContent = (content) => {
        if (!isFinancialAdvice) return content;

        // Parse financial advice sections
        const sections = content.split('\n\n').map((section, index) => {
            if (section.startsWith('1.') || section.startsWith('2.') || section.startsWith('3.')) {
                const [title, ...points] = section.split('\n');
                return (
                    <div key={index} className="advice-section">
                        <h3>{title}</h3>
                        <ul>
                            {points.map((point, i) => (
                                point.trim() && <li key={i}>{point.trim().replace(/^-\s*/, '')}</li>
                            ))}
                        </ul>
                    </div>
                );
            }
            return <p key={index}>{section}</p>;
        });

        return <div className="financial-advice">{sections}</div>;
    };

    return (
        <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
            <div className="message-avatar">
                <FontAwesomeIcon 
                    icon={isUser ? faUser : (isFinancialAdvice ? faChartLine : faRobot)} 
                />
            </div>
            <div className="message-content">
                {formatContent(content)}
                <div className="message-timestamp">
                    {format(new Date(timestamp), 'HH:mm')}
                </div>
            </div>
        </div>
    );
};

const ChatMessages = ({ chatHistory = [], error }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Add welcome message if no messages exist
    const displayMessages = chatHistory.length === 0 ? [{
        role: 'assistant',
        content: 'Welcome to CoinDrip AI Assistant!\n\nHow can I help you manage your finances today?',
        timestamp: new Date().toISOString()
    }] : chatHistory;

    return (
        <div className="chat-messages">
            <div className="messages-container">
                {displayMessages.map((message, index) => (
                    <ChatMessage 
                        key={index} 
                        message={message}
                    />
                ))}
                {error && (
                    <div 
                        className="error-message"
                    >
                        {error}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatMessages;