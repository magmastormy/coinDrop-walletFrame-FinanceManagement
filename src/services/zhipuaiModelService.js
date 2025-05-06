import axiosInstance from '../api/userAxios';

const API_URL = '/zhipuai';

const zhipuaiModelService = {
    async sendMessage(messages) {
        try {
            console.log('ZhipuAI Service - Sending message:', messages);
            const response = await axiosInstance.post(`${API_URL}/send`, { messages });
            console.log('ZhipuAI Service - Chat response:', response);
            return response;
        } catch (error) {
            console.error('ZhipuAI Service - Error sending message:', error);
            throw error;
        }
    },

    async getUserContext(userId) {
        try {
            console.log("[ZhipuAIService - getUserContext] - getting contexted advice")
            const response = await axiosInstance.get(`${API_URL}/user-context/${userId}`);
            console.log('[ZhipuAIService - getUserContext] - getting contexted advice response:', response);
            return response;
        } catch (error) {
            console.error('[ZhipuAIService - getUserContext] - Error sending message:', error);
            throw error;
        }
    },

    async getContextSuggestions(userId) {
        try {
            const response = await axiosInstance.get(`${API_URL}/context-suggestions/${userId}`);
            return response.suggestions || response;
        } catch (error) {
            console.error('ZhipuAI Service - Error fetching context suggestions:', error);
            throw error;
        }
    },

    async getContextAwareSuggestions(userId) {
        // alias for backward compatibility
        return this.getContextSuggestions(userId);
    },

    async getUserAccountInfo(userId) {
        try {
            const response = await axiosInstance.get(`${API_URL}/user-account-info/${userId}`);
            return response.context || response;
        } catch (error) {
            console.error('ZhipuAI Service - Error fetching user account info:', error);
            throw error;
        }
    },

    async getProactiveInsights(userId) {
        try {
            const response = await axiosInstance.get(`${API_URL}/proactive-insights/${userId}`);
            return response.insights || response;
        } catch (error) {
            console.error('ZhipuAI Service - Error fetching proactive insights:', error);
            throw error;
        }
    }
};

export default zhipuaiModelService;