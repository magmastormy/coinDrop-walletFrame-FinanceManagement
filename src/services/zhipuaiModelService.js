import { useLogger } from '../hooks/useLogger.jsx';

import axiosInstance from '../api/userAxios';

const API_URL = '/zhipuai';
const isDev = import.meta.env.DEV;

/**
 * ZhipuAI Model Service
 * Handles all AI-related API calls with proper user isolation
 * Note: userId is validated on backend via auth token
 */
const zhipuaiModelService = {
    /**
     * Send a message to the AI chatbot
     * @param {Array} messages - Array of message objects with role and content
     * @param {string} userId - User ID for context (validated by backend)
     * @returns {Promise} API response with AI message
     */
    async sendMessage(messages, userId) {
        try {
            if (isDev) logInfo('[ZhipuAI] Sending message for user:', userId);

            const response = await axiosInstance.post(`${API_URL}/send`, {
                messages
            });

            if (isDev) logInfo('[ZhipuAI] Response received');
            return response;
        } catch (error) {
            logError('[ZhipuAI] Error sending message:', error.message);
            throw error;
        }
    },

    /**
     * Get user financial context
     * @param {string} userId - User ID
     * @returns {Promise} User context data
     */
    async getUserContext(userId) {
        try {
            if (isDev) logInfo('[ZhipuAI] Fetching context for user:', userId);

            const response = await axiosInstance.get(`${API_URL}/user-context`);

            if (isDev) logInfo('[ZhipuAI] Context received');
            return response;
        } catch (error) {
            logError('[ZhipuAI] Error fetching context:', error.message);
            throw error;
        }
    },

    /**
     * Get context-aware suggestions for the user
     * @param {string} userId - User ID
     * @returns {Promise} Suggestions object
     */
    async getContextSuggestions(userId) {
        try {
            if (isDev) logInfo('[ZhipuAI] Fetching suggestions for user:', userId);

            const response = await axiosInstance.get(`${API_URL}/context-suggestions`);
            return response.suggestions || response;
        } catch (error) {
            logError('[ZhipuAI] Error fetching suggestions:', error.message);
            throw error;
        }
    },

    /**
     * Get user account information
     * @param {string} userId - User ID
     * @returns {Promise} Account info
     */
    async getUserAccountInfo(userId) {
        try {
            if (isDev) logInfo('[ZhipuAI] Fetching account info for user:', userId);

            const response = await axiosInstance.get(`${API_URL}/user-account-info`);
            return response.context || response;
        } catch (error) {
            logError('[ZhipuAI] Error fetching account info:', error.message);
            throw error;
        }
    },

    /**
     * Get proactive financial insights
     * @param {string} userId - User ID
     * @returns {Promise} Insights array
     */
    async getProactiveInsights(userId) {
        try {
            if (isDev) logInfo('[ZhipuAI] Fetching insights for user:', userId);

            const response = await axiosInstance.get(`${API_URL}/proactive-insights`);
            return response.insights || response;
        } catch (error) {
            logError('[ZhipuAI] Error fetching insights:', error.message);
            throw error;
        }
    }
};

export default zhipuaiModelService;
