import axiosInstance from '../api/userAxios';

const API_URL = '/zhipuai';

const zhipuaiModelService = {
    async sendMessage(messages) {
        try {
            // Get userId from localStorage for debugging
            let userId = null;
            try {
                const tokenData = localStorage.getItem('token');
                if (tokenData) {
                    const base64Url = tokenData.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    userId = payload.id || payload._id || payload.userId;
                }
            } catch (e) {
                console.error('Error extracting userId from token:', e);
            }
            
            console.log('***[ZhipuAI Service - sendMessage] User ID from token:', userId);
            console.log('***[ZhipuAI Service - sendMessage] Sending message:', messages);
            
            const response = await axiosInstance.post(`${API_URL}/send`, { 
                messages,
                userId // Explicitly include userId in payload
            });
            console.log('***[ZhipuAI Service - sendMessage] - Chat response:', response);
            return response;
        } catch (error) {
            console.error('ZhipuAI Service - Error sending message:', error);
            throw error;
        }
    },

    async getUserContext(userId) {
        try {
            console.log("***--->[ZhipuAIService - getUserContext] - getting contexted advice")
            const response = await axiosInstance.get(`${API_URL}/user-context/${userId}`);
            console.log('***--->[ZhipuAIService - getUserContext] - getting contexted advice response:', response);
            return response;
        } catch (error) {
            console.error('[ZhipuAIService - getUserContext] - Error sending message:', error);
            throw error;
        }
    },

    async getContextSuggestions(userId) {
        console.log("**[zhipuaiModelService - getContextSuggestions] route hit");
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
        console.log("**[zhipuaiModelService - getUserAccountInfo] route hit");
        try {
            const response = await axiosInstance.get(`${API_URL}/user-account-info/${userId}`);
            return response.context || response;
        } catch (error) {
            console.error('ZhipuAI Service - Error fetching user account info:', error);
            throw error;
        }
    },

    async getProactiveInsights(userId) {
        console.log("**[zhipuaiModelService - getProactiveInsights] route hit");
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