// ChatbotManager.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import {
  setLoading,
  addToChatHistory,
  setError,
  toggleChat,
} from '../../slices/zhipuaiModelSlice';
import zhipuaiModelService from '../../services/zhipuaiModelService';
import ChatHeader from './chatHeader';
import ChatMessages from './chatMessages';
import ChatInput from './chatInput';
import ChatHistoryPanel from './chatHistoryPanel';
import './styles/chatbotManagerStyles.css';

const ChatbotManager = () => {
  const dispatch = useDispatch();
  const { isLoading, chatHistory, error } = useSelector(state => state.zhipuaiModel);
  const chatContainerRef = useRef(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

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
        timestamp: new Date().toISOString(),
      }));

      const response = await zhipuaiModelService.sendMessage([...chatHistory, { role: 'user', content: message }]);
      const assistantMessage = response.map(item => item.content).join(' ');

      dispatch(addToChatHistory({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      dispatch(setError('Failed to send message'));
      console.error('Error sending message:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const toggleHistoryPanel = () => {
    setIsHistoryPanelOpen(!isHistoryPanelOpen);
  };

  return (
    <div className="chatbot-container">
      <ChatHeader onToggleChat={toggleChat} onOpenHistory={toggleHistoryPanel} />
      <div className="chat-messages" ref={chatContainerRef}>
        <ChatMessages chatHistory={chatHistory} error={error} />
      </div>
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      {isHistoryPanelOpen && <ChatHistoryPanel chatHistory={chatHistory} />}
    </div>
  );
};

export default ChatbotManager;