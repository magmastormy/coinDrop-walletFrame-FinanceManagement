import PropTypes from 'prop-types';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import ChatHeader from './chatHeader';
import QuickActionButtons from './QuickActionButtons';
import './chatbotStyles.css';

const ChatContainer = ({
    messages,
    onSendMessage,
    onInsightAction,
    onClearThread,
    loading,
    error,
    quickPrompts = []
}) => {
    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-surface">
            {/* Chat Header */}
            <ChatHeader onClearThread={onClearThread} />

            {/* Messages Area */}
            <ChatMessages
                messages={messages}
                onInsightAction={onInsightAction}
            />

            {/* Error Message */}
            {error && (
                <div className="mx-6 mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-center text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-1 rounded-lg bg-black/40 p-2">
                    <div className="loading-dot w-1.5 h-1.5 rounded-full bg-primary-curator"></div>
                    <div className="loading-dot w-1.5 h-1.5 rounded-full bg-primary-curator"></div>
                    <div className="loading-dot w-1.5 h-1.5 rounded-full bg-primary-curator"></div>
                </div>
            )}

            {/* Quick Action Buttons */}
            <QuickActionButtons 
                onSendMessage={onSendMessage} 
                quickPrompts={quickPrompts}
            />

            {/* Input Area */}
            <ChatInput
                onSendMessage={onSendMessage}
                disabled={loading}
                placeholder="Ask Curator anything about your wealth..."
            />
        </div>
    );
};

ChatContainer.propTypes = {
    messages: PropTypes.array.isRequired,
    onSendMessage: PropTypes.func.isRequired,
    onInsightAction: PropTypes.func,
    onClearThread: PropTypes.func,
    loading: PropTypes.bool,
    error: PropTypes.string,
    quickPrompts: PropTypes.array
};

export default ChatContainer;
