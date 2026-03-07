import React from 'react';
import { Bot, MessageSquare } from 'lucide-react';

const ChatHeader = ({ title = "Financial Assistant" }) => {
    return (
        <div className="flex items-center justify-between border-b border-white/10 bg-white/30 px-4 py-3 backdrop-blur-md dark:bg-white/5">
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-primary/20 bg-primary/20 p-2 text-primary">
                    <Bot className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground md:text-lg">{title}</h2>
                    <p className="text-xs text-muted-foreground">Live assistant • context-aware</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/70">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <MessageSquare className="w-5 h-5" />
            </div>
        </div>
    );
};

export default ChatHeader;
