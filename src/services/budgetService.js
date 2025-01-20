import axiosInstance from '../api/userAxios';

const API_URL = '/budgets';

// Export individual functions for better tree-shaking
export const getUserBudgets = async (userId, filters = {}) => {
    try {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
        return response;
    } catch (error) {
        console.error('Error fetching user budgets:', error);
        throw error;
    }
};

export const getBudgetStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response;
    } catch (error) {
        console.error('Error fetching budget stats:', error);
        throw error;
    }
};

const budgetService = {
    createBudget: async (budgetData) => {
        const response = await axiosInstance.post(API_URL, budgetData);
        return response.data;
    },

    getUserBudgets: async (userId, filters = {}) => {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
        return response;
    },

    updateBudget: async (id, budgetData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, budgetData);
        return response.data;
    },

    deleteBudget: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getBudgetStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response;
    }
};

export default budgetService;