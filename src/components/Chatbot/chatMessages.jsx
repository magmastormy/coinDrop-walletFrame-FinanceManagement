import React, { useEffect, useRef } from 'react';
import { Lightbulb, Info, Wallet, PiggyBank, PieChart, AlertCircle, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

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
        if (!content) return Lightbulb;

        if (content.includes('spending') || content.includes('expense')) {
            return Wallet;
        } else if (content.includes('saving') || content.includes('goal')) {
            return PiggyBank;
        } else if (content.includes('budget')) {
            return PieChart;
        } else if (content.includes('income') || content.includes('categorized')) {
            return AlertCircle;
        }

        return Lightbulb;
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
                    <div className="space-y-4">
                        {Object.entries(contextData).map(([category, insights]) => {
                            if (!insights || insights.length === 0) return null;

                            return (
                                <div key={category} className="space-y-2">
                                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                                        {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </h4>
                                    <ul className="space-y-2">
                                        {insights.map((insight, idx) => {
                                            const Icon = getInsightIcon(insight);
                                            return (
                                                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                    <Icon className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                                    <span className="text-sm text-muted-foreground flex-1">{insight}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0"
                                                        onClick={() => onInsightAction(
                                                            `${category}-${idx}`,
                                                            'view-details',
                                                            { category, insight }
                                                        )}
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </Button>
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
                return <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{content}</ReactMarkdown>;
            }
        }

        return <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{content}</ReactMarkdown>;
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
                    <Bot className="w-12 h-12 mb-2" />
                    <p>Ask me anything about your finances!</p>
                </div>
            )}

            {messages.map((message, index) => {
                // Skip rendering system messages
                if (message.role === 'system') return null;

                // Check if this message contains a financial insight
                const isInsight = message.content.includes('💡') || message.type === 'proactive';
                const isUser = message.role === 'user';
                const InsightIcon = isInsight ? getInsightIcon(message.content) : null;

                return (
                    <div
                        key={`${message.role}-${index}-${message.timestamp}`}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        )}>
                            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>

                        <div className={cn(
                            "flex flex-col gap-1",
                            isUser ? "items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "p-3 rounded-2xl text-sm",
                                isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white/10 text-foreground rounded-tl-none",
                                isInsight && "border border-amber-500/50 bg-amber-500/10"
                            )}>
                                {isInsight && (
                                    <div className="flex items-center gap-2 mb-2 text-amber-500 font-medium">
                                        <InsightIcon className="w-4 h-4" />
                                        <span>Insight</span>
                                    </div>
                                )}

                                <div className="whitespace-pre-wrap">
                                    {renderInsightContent(message.content)}
                                </div>

                                {/* Show action buttons for insights */}
                                {isInsight && onInsightAction && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onInsightAction(index, 'dismiss')}
                                            className="h-7 text-xs hover:bg-white/10"
                                        >
                                            Dismiss
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => onInsightAction(
                                                index,
                                                'view-details',
                                                { type: 'insight', content: message.content }
                                            )}
                                            className="h-7 text-xs"
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {message.timestamp && (
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {formatTime(message.timestamp)}
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
