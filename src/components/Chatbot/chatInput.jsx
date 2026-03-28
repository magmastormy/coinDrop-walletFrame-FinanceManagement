import React, { useState, useRef, useEffect } from 'react';
import './chatbotStyles.css';

const ChatInput = ({ onSendMessage, disabled = false, placeholder = "Ask Curator anything about your wealth..." }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`;
        }
    }, [message]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow effect on focus */}
                <div className="absolute inset-0 bg-primary-curator/5 blur-2xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-end bg-surface-container-low rounded-2xl p-2 border border-outline-variant/20 group-focus-within:border-primary-curator/40 transition-all duration-200 glow-focus">
                    {/* Attachment button */}
                    <button
                        type="button"
                        disabled={disabled}
                        className="p-3 text-tertiary hover:text-primary-curator transition-colors disabled:opacity-50"
                        aria-label="Attach file"
                    >
                        <span className="material-symbols-outlined">attach_file</span>
                    </button>

                    {/* Text input */}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-tertiary text-sm px-2 py-3 resize-none min-h-[44px] max-h-[112px] font-body outline-none"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pr-2">
                        {/* Mic button */}
                        <button
                            type="button"
                            disabled={disabled}
                            className="p-3 text-tertiary hover:text-secondary-curator transition-colors disabled:opacity-50"
                            aria-label="Voice input"
                        >
                            <span className="material-symbols-outlined">mic</span>
                        </button>

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={!message.trim() || disabled}
                            className="p-3 primary-gradient rounded-xl text-white shadow-lg shadow-primary-curator/20 hover-scale disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Send message"
                        >
                            <span className="material-symbols-outlined filled">send</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
