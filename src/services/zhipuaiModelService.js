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

    async getFinancialAdvice(userId) {
        try {
            console.log('ZhipuAI Service - Getting financial advice for user:', userId);
            const response = await axiosInstance.get(`${API_URL}/${userId}/financial-advice`);
            
            if (!response?.advice) {
                throw new Error('Invalid response from AI service');
            }

            return response.advice;
        } catch (error) {
            console.error('ZhipuAI Service - Error getting financial advice:', error);
            throw error;
        }
    }
};

export default zhipuaiModelService;