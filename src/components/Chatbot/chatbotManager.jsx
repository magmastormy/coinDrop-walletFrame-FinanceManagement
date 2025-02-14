// ChatbotManager.js
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faEllipsisH, faDatabase } from '@fortawesome/free-solid-svg-icons';
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
  const [useContext, setUseContext] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    // Prevent body scroll when chatbot is open
    if (isHistoryPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isHistoryPanelOpen]);

  const handleSubmit = async (message) => {
    if (!message) return;

    try {
      dispatch(setError(""));
      dispatch(setLoading(true));
      
      // Create message with context meta
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        meta: useContext ? {
          context: {
            wallets: wallets.slice(0, 3).map(w => ({
              name: w.name,
              balance: w.balance
            })),
            lastTransaction: transactions[0] ? {
              amount: transactions[0].amount,
              category: transactions[0].category
            } : null,
            savingsBalance: savingsAccounts.reduce((acc, curr) => acc + curr.balance, 0)
          }
        } : null
      };

      dispatch(addToChatHistory(userMessage));

      // Get AI response with context
      const response = await zhipuaiModelService.sendMessage(
        [...chatHistory, userMessage],
        useContext ? {
          wallets,
          savingsAccounts,
          transactions: transactions.slice(0, 10) // Last 10 transactions
        } : null
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.map(item => item.content).join(' '),
        timestamp: new Date().toISOString(),
        contextUsed: useContext // Flag for UI indication
      };

      dispatch(addToChatHistory(assistantMessage));
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

  const toggleContext = () => {
    setUseContext(!useContext);
    setIsContextMenuOpen(false);
  };

  return (
    <motion.div 
      className="chatbot-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ChatHeader 
        onToggleChat={toggleChat}
        onOpenHistory={toggleHistoryPanel}
        onToggleContext={() => setIsContextMenuOpen(!isContextMenuOpen)}
        useContext={useContext}
      />
      <div className="chat-body">
        <div className="chat-messages" ref={chatContainerRef}>
          <ChatMessages chatHistory={chatHistory} error={error} />
        </div>
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
        <AnimatePresence>
          {isHistoryPanelOpen && <ChatHistoryPanel chatHistory={chatHistory} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isContextMenuOpen && (
          <motion.div 
            className="context-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <label className="context-option">
              <input
                type="checkbox"
                checked={useContext}
                onChange={toggleContext}
              />
              Use My Financial Data
            </label>
            <div className="context-info">
              {useContext && `Including: ${wallets.length} wallets, ${transactions.length} transactions`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatbotManager;