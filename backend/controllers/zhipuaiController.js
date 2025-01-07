const axios = require('axios');
require('dotenv').config();

const API_ENDPOINT = process.env.ZHIPU_API_ENDPOINT;
const API_KEY = process.env.ZHIPU_API_KEY;

const zhipuaiController = {
    async sendMessage(req, res) {
        try {
            const { messages } = req.body;
            
            console.log('ZhipuAI Controller - Received messages:', messages);

            const response = await axios.post(API_ENDPOINT, messages, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('ZhipuAI Controller - Response:', response.data);
            res.json(response.data);
        } catch (error) {
            console.error('ZhipuAI Controller - Error:', error);
            res.status(500).json({ 
                error: 'Failed to communicate with ZhipuAI',
                details: error.message 
            });
        }
    },

    async getHistory(req, res) {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Here you would typically fetch chat history from your database
            // For now, returning empty array as placeholder
            res.json({ history: [] });
        } catch (error) {
            console.error('ZhipuAI Controller - Error fetching history:', error);
            res.status(500).json({ 
                error: 'Failed to fetch chat history',
                details: error.message 
            });
        }
    }
};

module.exports = zhipuaiController;