import axiosInstance from '../api/userAxios';

const API_URL = '/budgets';

const budgetService = {
    createBudget: async (budgetData) => {
        const response = await axiosInstance.post(API_URL, budgetData);
        return response.data;
    },

    getUserBudgets: async (userId) => {
        console.log("Budget Service- getUserBudgets for userId:", userId);
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
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
        return response.data;
    }
};

export default budgetService;