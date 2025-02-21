import axiosInstance from "../api/userAxios";

const API_URL = '/zhipuai'; //dont change this line

const zhipuaiModelService = {
    async sendMessage(messages) {
        try {
            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

            console.log('ZhipuAI Service - Sending messages:', formattedMessages);
            const response = await axiosInstance.post(`${API_URL}/send`, { messages: formattedMessages });
            console.log('ZhipuAI Service - Response:', response);
            
            if (!response?.response) {
                throw new Error('Invalid response format from server');
            }
            
            return { response: response.response };
        } catch (error) {
            console.error('ZhipuAI Service - Error:', error);
            throw error;
        }
    },

    async getFinancialAdvice(userFinancialData) {
        try {
            console.log('ZhipuAI Service - Getting financial advice with data:', userFinancialData);
            const response = await axiosInstance.post(`${API_URL}/financial-advice`, userFinancialData);
            console.log('ZhipuAI Service - Financial advice response:', response.data);
            
            if (!response?.advice) {
                throw new Error('Invalid financial advice response format');
            }
            
            return response.advice;
        } catch (error) {
            console.error('ZhipuAI Service - Error getting financial advice:', error);
            throw error;
        }
    },

    async getChatHistory(userId) {
        try {
            console.log('ZhipuAI Service - Fetching history for user:', userId);
            const response = await axiosInstance.get(`${API_URL}/history`, {
                params: { userId }
            });
            console.log('ZhipuAI Service - History:', response.data);
            return response.data.history;
        } catch (error) {
            console.error('ZhipuAI Service - Error fetching history:', error);
            return [];
        }
    },

    async processVideo(videoUrl, prompt) {
        try {
            console.log('ZhipuAI Service - Processing video:', videoUrl, 'with prompt:', prompt);
            const response = await axiosInstance.post(`${API_URL}/process-video`, {
                videoUrl,
                prompt
            });
            console.log('ZhipuAI Service - Video processing response:', response.data);
            return response.data;
        } catch (error) {
            console.error('ZhipuAI Service - Error processing video:', error);
            throw error;
        }
    }
};

export default zhipuaiModelService;