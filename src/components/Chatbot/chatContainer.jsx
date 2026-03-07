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
        <GlassCard className="flex h-[72vh] min-h-[560px] w-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-0 shadow-2xl dark:from-white/10 dark:via-white/5">
            <ChatHeader title="Financial Assistant" />

            <div className="relative flex min-h-0 flex-1 flex-col bg-black/10 dark:bg-black/20">
                <ChatMessages
                    messages={messages}
                    onInsightAction={onInsightAction}
                />

                {error && (
                    <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400 backdrop-blur-md">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
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
    onInsightAction: PropTypes.func,
    loading: PropTypes.bool,
    error: PropTypes.string
};

export default ChatContainer;
