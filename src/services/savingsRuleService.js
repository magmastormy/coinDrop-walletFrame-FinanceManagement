import { useLogger } from '../hooks/useLogger.jsx';

import axiosInstance from '../api/userAxios';

const API_URL = '/savings-rules';

const savingsRuleService = {
    getUserRules: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logError('Savings Rule Service - Error fetching rules:', error);
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

    executeAllRules: async () => {
        const response = await axiosInstance.post(`${API_URL}/execute-all`);
        return response;
    },

    getRuleStats: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/stats`);
            return response || {};
        } catch (error) {
            logError('Savings Rule Service - Error fetching rule stats:', error);
            return {};
        }
    },

    setupAutoTransfer: async transferData => {
        const response = await axiosInstance.post(`${API_URL}/auto-transfer`, transferData);
        return response;
    },

    updateGoalBasedSavings: async (goalId, config) => {
        const response = await axiosInstance.put(`${API_URL}/goal-based/${goalId}`, config);
        return response;
    }
};

export default savingsRuleService;
