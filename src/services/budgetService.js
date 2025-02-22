import axiosInstance from '../api/userAxios';

const API_URL = '/budgets';

// Export individual functions for better tree-shaking
export const getUserBudgets = async (userId, filters = {}) => {
    try {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
        console.log('[BudgetService - getUserBudgets] Successfully fetched user budgets:', response);
        return response;
    } catch (error) {
        console.error('[BudgetService - getUserBudgets] Error fetching user budgets:', error);
        throw error;
    }
};

export const getBudgetStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        console.log('[BudgetService - getBudgetStats] Successfully fetched budget stats:', response);
        return response;
    } catch (error) {
        console.error('[BudgetService - getBudgetStats] Error fetching budget stats:', error);
        throw error;
    }
};

const budgetService = {
    createBudget: async (budgetData) => {
        try {
            const response = await axiosInstance.post(API_URL, {
                ...budgetData,
                amount: parseFloat(budgetData.amount),
                currency: 'USD' // Default currency
            });
            return response.data;
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            throw new Error(serverMessage || 'Budget validation failed');
        }
    },

    getUserBudgets: async (userId, filters = {}) => {
        try {
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
            console.log('[BudgetService - getUserBudgets] Successfully fetched user budgets:', response);
            return response;
        } catch (error) {
            console.error('[BudgetService - getUserBudgets] Error fetching user budgets:', error);
            throw error;
        }
    },

    updateBudget: async (id, budgetData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${id}`, budgetData);
            console.log('[BudgetService - updateBudget] Successfully updated budget:', response.data);
            return response.data;
        } catch (error) {
            console.error('[BudgetService - updateBudget] Error updating budget:', error);
            throw error;
        }
    },

    deleteBudget: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log('[BudgetService - deleteBudget] Successfully deleted budget:', response.data);
            return response.data;
        } catch (error) {
            console.error('[BudgetService - deleteBudget] Error deleting budget:', error);
            throw error;
        }
    },

    getBudgetStats: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/stats`);
            console.log('[BudgetService - getBudgetStats] Successfully fetched budget stats:', response.data);
            return response;
        } catch (error) {
            console.error('[BudgetService - getBudgetStats] Error fetching budget stats:', error);
            throw error;
        }
    }
};

export default budgetService;