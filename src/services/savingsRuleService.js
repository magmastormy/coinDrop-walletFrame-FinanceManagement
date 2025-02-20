import axiosInstance from '../api/userAxios';

const API_URL = '/savings-rules';

const savingsRuleService = {
    // Get all rules for a user
    getUserRules: async (userId) => {
        try {
            if (!userId) {
                throw new Error('UserId is required');
            }
            
            console.log("Savings Rule Service - getUserRules - userId Received: ", userId);
            const response = await axiosInstance.get(`${API_URL}/user/${userId}`);
            return response.data || [];
        } catch (error) {
            console.error('Savings Rule Service - Error fetching rules:', error);
            return [];
        }
    },

    // Create a new rule
    createRule: async (ruleData) => {
        try {
            const response = await axiosInstance.post(API_URL, ruleData);
            return response.data;
        } catch (error) {
            console.error('Savings Rule Service - Error creating rule:', error);
            throw error;
        }
    },

    // Update a rule
    updateRule: async (ruleId, ruleData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${ruleId}`, ruleData);
            return response.data;
        } catch (error) {
            console.error('Savings Rule Service - Error updating rule:', error);
            throw error;
        }
    },

    // Delete a rule
    deleteRule: async (ruleId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${ruleId}`);
            return response.data;
        } catch (error) {
            console.error('Savings Rule Service - Error deleting rule:', error);
            throw error;
        }
    },

    // Execute rules for a transaction
    executeRules: async (transactionData) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/execute`, transactionData);
            return response.data;
        } catch (error) {
            console.error('Savings Rule Service - Error executing rules:', error);
            throw error;
        }
    },

    // Get rule statistics
    getRuleStats: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/stats/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Savings Rule Service - Error fetching rule stats:', error);
            return {};
        }
    }
};

export default savingsRuleService;
