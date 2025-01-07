import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faRobot } from '@fortawesome/free-solid-svg-icons';
import { 
    setLoading, 
    addToChatHistory, 
    setError, 
    toggleChat,
    clearChatHistory 
} from '../../slices/zhipuaiModelSlice';
import zhipuaiModelService from '../../services/zhipuaiModelService';
import './styles/chatbotManagerStyles.css';

const ChatbotManager = () => {
    const dispatch = useDispatch();
    const { isLoading, chatHistory, error, isChatOpen } = useSelector(state => state.zhipuaiModel);
    const { user } = useSelector(state => state.auth);
    const messageRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const message = messageRef.current.value.trim();
        if (!message) return;

        try {
            dispatch(setLoading(true));
            dispatch(addToChatHistory({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            }));

            messageRef.current.value = '';

            const response = await zhipuaiModelService.sendMessage([
                ...chatHistory,
                { role: 'user', content: message }
            ]);

            dispatch(addToChatHistory({
                role: 'assistant',
                content: response.content,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            dispatch(setError('Failed to send message'));
            console.error('Error sending message:', error);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const renderMessage = (message, index) => (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
        >
            {message.role === 'assistant' && (
                <FontAwesomeIcon icon={faRobot} className="bot-icon" />
            )}
            <div className="message-content">
                <p>{message.content}</p>
                <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </span>
            </div>
        </motion.div>
    );

    return (
        <>
            {/* Chat Toggle Button */}
            <button 
                className="chat-toggle-btn"
                onClick={() => dispatch(toggleChat())}
            >
                <FontAwesomeIcon icon={faRobot} />
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="chat-window"
                    >
                        {/* Chat Header */}
                        <div className="chat-header">
                            <h3>CoinDrip AI Assistant</h3>
                            <div className="header-actions">
                                <button 
                                    onClick={() => dispatch(clearChatHistory())}
                                    className="clear-btn"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={() => dispatch(toggleChat())}
                                    className="close-btn"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="chat-messages" ref={chatContainerRef}>
                            {chatHistory.length === 0 ? (
                                <div className="welcome-message">
                                    <FontAwesomeIcon icon={faRobot} className="welcome-icon" />
                                    <h4>Hello! I'm your CoinDrip AI assistant.</h4>
                                    <p>How can I help you today?</p>
                                </div>
                            ) : (
                                chatHistory.map(renderMessage)
                            )}
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSubmit} className="chat-input">
                            <input
                                type="text"
                                ref={messageRef}
                                placeholder="Type your message..."
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="send-btn"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatbotManager;