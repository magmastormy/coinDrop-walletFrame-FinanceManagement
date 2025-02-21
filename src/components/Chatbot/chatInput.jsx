import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMicrophone, faImage } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/chatInputStyles.css';

const ChatInput = ({ onSendMessage, isLoading }) => {
    const { theme } = useTheme();
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <motion.div 
            className="chat-input-container"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
                backgroundColor: theme.background.secondary,
                borderColor: theme.button.base + '20'
            }}
        >
            <form onSubmit={handleSubmit} className="chat-form">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    style={{
                        backgroundColor: theme.background.primary,
                        color: theme.text.primary,
                        borderColor: theme.border
                    }}
                />
                
                <div className="chat-actions">
                    <motion.button
                        type="submit"
                        className="send-button"
                        disabled={!message.trim() || isLoading}
                        whileHover={message.trim() ? { scale: 1.05 } : {}}
                        whileTap={message.trim() ? { scale: 0.95 } : {}}
                        style={{
                            backgroundColor: message.trim() ? theme.button.base : theme.button.base + '50',
                            color: 'white'
                        }}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

export default ChatInput;