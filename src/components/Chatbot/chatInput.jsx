import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

const ChatInput = ({ onSendMessage, disabled = false, placeholder = "Type a message..." }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    return (
        <div className="border-t border-white/10 bg-white/30 p-4 backdrop-blur-md dark:bg-white/5">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/15 bg-black/10 px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50"
                />
                <Button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};

export default ChatInput;
