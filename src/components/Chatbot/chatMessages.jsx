import React, { useEffect, useRef } from 'react';
import { Lightbulb, Info, Wallet, PiggyBank, PieChart, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './chatbotStyles.css';

const ChatMessages = ({ messages = [], onInsightAction }) => {
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
        const safe = typeof content === 'string' ? content : '';
        if (!safe) return Lightbulb;

        if (safe.includes('spending') || safe.includes('expense')) {
            return Wallet;
        } else if (safe.includes('saving') || safe.includes('goal')) {
            return PiggyBank;
        } else if (safe.includes('budget')) {
            return PieChart;
        } else if (safe.includes('income') || safe.includes('categorized')) {
            return AlertCircle;
        }

        return Lightbulb;
    };

    // Parse and render insight content with optional highlight
    const renderInsightContent = (content) => {
        const safeContent = typeof content === 'string' ? content : '';
        // Check if this is a system message containing suggestion data in JSON format
        if (safeContent.startsWith('Context:')) {
            try {
                // Extract the JSON part between Context: and the end
                const jsonStr = safeContent.replace('Context:', '').trim();
                const contextData = JSON.parse(jsonStr);

                return (
                    <div className="space-y-4">
                        {Object.entries(contextData).map(([category, insights]) => {
                            if (!insights || insights.length === 0) return null;

                            return (
                                <div key={category} className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-primary-curator">
                                        {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </h4>
                                    <ul className="space-y-2">
                                        {insights.map((insight, idx) => {
                                            const Icon = getInsightIcon(insight);
                                            return (
                                                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                                                    <Icon className="w-5 h-5 shrink-0 mt-0.5 text-on-surface-variant" />
                                                    <span className="text-sm text-on-surface-variant flex-1">{insight}</span>
                                                    <button
                                                        type="button"
                                                        className="h-6 w-6 shrink-0 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors"
                                                        onClick={() => onInsightAction(
                                                            `${category}-${idx}`,
                                                            'view-details',
                                                            { category, insight }
                                                        )}
                                                    >
                                                        <Info className="w-4 h-4 text-on-surface-variant" />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                );
            } catch (e) {
                // Fall back to markdown rendering if JSON parsing fails
                return <ReactMarkdown className="prose prose-sm max-w-none prose-invert">{safeContent}</ReactMarkdown>;
            }
        }

        return <ReactMarkdown className="prose prose-sm max-w-none prose-invert">{safeContent}</ReactMarkdown>;
    };

    return (
        <div className="flex-1 overflow-y-auto chat-scrollbar space-y-6 p-6">
            {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/30 text-center text-tertiary">
                    <span className="material-symbols-outlined text-6xl mb-4">smart_toy</span>
                    <p className="text-sm font-body">Ask me anything about your finances.</p>
                </div>
            )}

            {messages.map((message, index) => {
                // Skip rendering system messages
                if (message.role === 'system') return null;

                const messageContent = typeof message.content === 'string' ? message.content : '';

                // Check if this message contains a financial insight
                const isInsight = message.type === 'proactive' || messageContent.includes('Proactive Insight');
                const isUser = message.role === 'user';
                const InsightIcon = isInsight ? getInsightIcon(messageContent) : null;

                return (
                    <div
                        key={`${message.role}-${index}-${message.timestamp}`}
                        className={`flex gap-4 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''} group fade-in`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Avatar */}
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            isUser 
                                ? 'primary-gradient border-transparent' 
                                : 'bg-surface-container-highest border-outline-variant/30'
                        }`}>
                            <span className={`material-symbols-outlined text-sm ${isUser ? 'text-white' : 'text-primary-curator'}`}>
                                {isUser ? 'person' : 'smart_toy'}
                            </span>
                        </div>

                        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                            {/* Message Bubble */}
                            <div className={`relative p-4 text-sm leading-relaxed ${
                                isUser 
                                    ? 'primary-gradient text-white rounded-2xl rounded-tr-none user-message-shadow' 
                                    : 'glass-panel text-on-surface rounded-2xl rounded-tl-none bot-message-shadow'
                            }`}>
                                {isInsight && (
                                    <div className="flex items-center gap-2 mb-2 text-secondary-curator font-medium">
                                        <InsightIcon className="w-4 h-4" />
                                        <span>Insight</span>
                                    </div>
                                )}

                                <div className="whitespace-pre-wrap">
                                    {renderInsightContent(messageContent)}
                                </div>

                                {/* Show action buttons for insights */}
                                {isInsight && onInsightAction && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/20">
                                        <button
                                            type="button"
                                            onClick={() => onInsightAction(index, 'dismiss')}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onInsightAction(
                                                index,
                                                'view-details',
                                                { type: 'insight', content: messageContent }
                                            )}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Timestamp */}
                            {message.timestamp && (
                                <span className="text-[10px] text-tertiary font-medium uppercase tracking-wide px-1">
                                    {isUser ? 'You' : 'Curator AI'} • {formatTime(message.timestamp)}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
