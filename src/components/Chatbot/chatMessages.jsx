import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faInfoCircle, faWallet, faPiggyBank, faChartPie, faExclamationCircle, faUser, faRobot } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import './styles/chatMessagesStyles.css';

const ChatMessages = ({ messages = [], onInsightAction, activeInsight }) => {
    const messagesEndRef = useRef(null);
    
    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    
    // Format timestamp for display
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    // Get icon for insight type
    const getInsightIcon = (content) => {
        if (!content) return faLightbulb;
        
        if (content.includes('spending') || content.includes('expense')) {
            return faWallet;
        } else if (content.includes('saving') || content.includes('goal')) {
            return faPiggyBank;
        } else if (content.includes('budget')) {
            return faChartPie;
        } else if (content.includes('income') || content.includes('categorized')) {
            return faExclamationCircle;
        }
        
        return faLightbulb;
    };

    // Parse and render insight content with optional highlight
    const renderInsightContent = (content) => {
        // Check if this is a system message containing suggestion data in JSON format
        if (content.startsWith('Context:')) {
            try {
                // Extract the JSON part between Context: and the end
                const jsonStr = content.replace('Context:', '').trim();
                const contextData = JSON.parse(jsonStr);
                
                return (
                    <div className="context-suggestions">
                        {Object.entries(contextData).map(([category, insights]) => {
                            if (!insights || insights.length === 0) return null;
                            
                            return (
                                <div key={category} className="context-category">
                                    <h4>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                                    <ul>
                                        {insights.map((insight, idx) => (
                                            <li key={idx}>
                                                <FontAwesomeIcon icon={getInsightIcon(insight)} />
                                                <span>{insight}</span>
                                                <button 
                                                    className="action-button"
                                                    onClick={() => onInsightAction(
                                                        `${category}-${idx}`,
                                                        'view-details',
                                                        { category, insight }
                                                    )}
                                                >
                                                    <FontAwesomeIcon icon={faInfoCircle} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                );
            } catch (e) {
                // Fall back to markdown rendering if JSON parsing fails
                return <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>;
            }
        }
        
        // Check if content contains section headers (##)
        if (content.includes('##')) {
            // Special handling for sections about savings goals
            if (content.includes('## SAVINGS GOALS') || content.includes('## Savings Goals')) {
                return (
                    <div className="formatted-sections savings-section">
                        <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>
                    </div>
                );
            }
            
            return (
                <div className="formatted-sections">
                    <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>
                </div>
            );
        }
        
        // Check if content is specifically about Savings Goals but without section headers
        if (content.includes('Savings Goals:')) {
            return (
                <div className="formatted-sections savings-section">
                    <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>
                </div>
            );
        }
        
        // Check if content includes bullet points or asterisks
        if (content.includes('- ') || content.includes('* ') || content.includes('•')) {
            return <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>;
        }
        
        // Check if the message has multiple paragraphs
        if (content.includes('\n\n') || content.includes('\n')) {
            return <ReactMarkdown className="formatted-message">{content}</ReactMarkdown>;
        }
        
        // Simple text message
        return <p>{content}</p>;
    };

    return (
        <div className="chat-messages">
            <div className="messages-container">
                {messages.length === 0 && (
                    <div className="empty-chat">
                        <p>Ask me anything about your finances!</p>
                    </div>
                )}
                
                {messages.map((message, index) => {
                    // Skip rendering system messages
                    if (message.role === 'system') return null;
                    
                    // Check if this message contains a financial insight
                    const isInsight = message.content.includes('💡') || message.type === 'proactive';
                    const insightType = isInsight ? 
                        (message.content.includes('spending') ? 'spending' :
                         message.content.includes('saving') ? 'savings' :
                         message.content.includes('budget') ? 'budget' : 'general') 
                        : null;
                    const isUser = message.role === 'user';
                    const isAssistant = message.role === 'assistant';
                    return (
                        <div 
                            key={`${message.role}-${index}-${message.timestamp}`}
                            className={`message ${message.role} ${message.type === 'proactive' ? 'proactive' : ''} ${isInsight ? 'insight ' + insightType : ''}`}
                        >
                            {/* Avatar */}
                            {isUser && <div className="avatar user-avatar"><FontAwesomeIcon icon={faUser} /></div>}
                            {isAssistant && <div className="avatar assistant-avatar"><FontAwesomeIcon icon={faRobot} /></div>}
                            <div className="message-bubble">
                                {isInsight && (
                                    <div className="insight-icon">
                                        <FontAwesomeIcon icon={getInsightIcon(message.content)} />
                                    </div>
                                )}
                                
                                <div className={`message-content ${isAssistant ? 'ai-message' : ''}`}>
                                    {renderInsightContent(message.content)}
                                </div>
                                
                                {/* Show action buttons for insights */}
                                {isInsight && onInsightAction && (
                                    <div className="insight-actions">
                                        <button 
                                            onClick={() => onInsightAction(index, 'dismiss')}
                                            className="insight-action dismiss"
                                        >
                                            Dismiss
                                        </button>
                                        <button 
                                            onClick={() => onInsightAction(
                                                index, 
                                                'view-details',
                                                { type: insightType, content: message.content }
                                            )}
                                            className="insight-action view"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                )}
                                
                                {message.timestamp && (
                                    <div className="message-time">
                                        {formatTime(message.timestamp)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatMessages;