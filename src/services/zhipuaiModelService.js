import axiosInstance from "../api/userAxios";

const API_URL = '/zhipuai';

const zhipuaiModelService = {
    async sendMessage(messages) {
        try {
            console.log('ZhipuAI Service - Sending messages:', messages);
            const response = await axiosInstance.post(`${API_URL}/send`, { messages });
            console.log('ZhipuAI Service - Response:', response);
            return response;
        } catch (error) {
            console.error('ZhipuAI Service - Error:', error);
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