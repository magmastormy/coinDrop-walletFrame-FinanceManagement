import PropTypes from 'prop-types';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import ChatHeader from './chatHeader';
import { GlassCard } from '../ui/GlassCard';

const ChatContainer = ({
    messages,
    onSendMessage,
    onInsightAction,
    loading,
    error
}) => {
    return (
        <GlassCard className="flex flex-col h-[600px] w-full max-w-md mx-auto overflow-hidden shadow-2xl border-white/10">
            <ChatHeader title="Financial Assistant" />

            <div className="flex-1 relative flex flex-col min-h-0 bg-black/20">
                <ChatMessages
                    messages={messages}
                    onInsightAction={onInsightAction}
                />

                {error && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center backdrop-blur-md">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 p-2 bg-black/40 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                )}
            </div>

            <ChatInput
                onSendMessage={onSendMessage}
                disabled={loading}
                placeholder="Ask about your finances..."
            />
        </GlassCard>
    );
};

ChatContainer.propTypes = {
    messages: PropTypes.array.isRequired,
    onSendMessage: PropTypes.func.isRequired,
    onInsightAction: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string
};

export default ChatContainer;
