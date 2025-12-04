import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 bg-black/20 border-white/10 focus:border-primary/50"
                />
                <Button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className="shrink-0"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};

export default ChatInput;