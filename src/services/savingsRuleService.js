import axiosInstance from '../api/userAxios';

const API_URL = '/savings-rules';

const savingsRuleService = {
    getUserRules: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Savings Rule Service - Error fetching rules:', error);
            return [];
        }
    },

    createRule: async ruleData => {
        const response = await axiosInstance.post(API_URL, ruleData);
        return response;
    },

    updateRule: async (ruleId, ruleData) => {
        const response = await axiosInstance.put(`${API_URL}/${ruleId}`, ruleData);
        return response;
    },

    deleteRule: async ruleId => {
        const response = await axiosInstance.delete(`${API_URL}/${ruleId}`);
        return response;
    },

    executeRules: async transactionData => {
        const response = await axiosInstance.post(`${API_URL}/execute`, transactionData);
        return response;
    },

    getRuleStats: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/stats`);
            return response || {};
        } catch (error) {
            console.error('Savings Rule Service - Error fetching rule stats:', error);
            return {};
        }
    }
};

export default savingsRuleService;
