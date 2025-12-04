import React from 'react';
import { Bot, MessageSquare } from 'lucide-react';

const ChatHeader = ({ title = "Financial Assistant" }) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-xs text-muted-foreground">Ask me about your finances</p>
                </div>
            </div>
            <div className="text-muted-foreground/50">
                <MessageSquare className="w-5 h-5" />
            </div>
        </div>
    );
};

export default ChatHeader;
