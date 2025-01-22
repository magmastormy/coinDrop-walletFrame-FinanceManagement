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
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import './styles/chatbotContainerStyles.css';

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

    const handleSubmit = async (message) => {
        if (!message) return;

        try {
            dispatch(setError(""));
            dispatch(setLoading(true));
            dispatch(addToChatHistory({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            }));

            const response = await zhipuaiModelService.sendMessage([
                ...chatHistory,
                { role: 'user', content: message }
            ]);

            const assistantMessage = response.map(item => item.content).join(' ');

            dispatch(addToChatHistory({
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            dispatch(setError('Failed to send message'));
            console.error('Error sending message:', error);
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="chatbot-container">
            <ChatHeader onClearChat={() => dispatch(clearChatHistory())} />
            <ChatMessages chatHistory={chatHistory} error={error} />
            <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    );
};

export default ChatbotManager;