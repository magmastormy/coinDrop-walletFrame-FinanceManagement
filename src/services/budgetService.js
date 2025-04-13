import axiosInstance from '../api/userAxios';

const API_URL = '/budgets';

// Export individual functions for better tree-shaking
export const getUserBudgets = async (userId, filters = {}) => {
    try {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
        console.log('[BudgetService - getUserBudgets] Successfully fetched user budgets');
        return response;
    } catch (error) {
        console.error('[BudgetService - getUserBudgets] Error fetching user budgets:', error);
        throw error;
    }
};

export const getBudgetStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        console.log('[BudgetService - getBudgetStats] Successfully fetched budget stats');
        
        // Check if we have chart data in the response
        if (response?.data?.chartData) {
            return response.data.chartData;
        } else {
            console.warn('[BudgetService - getBudgetStats] No chart data found in response');
            return { error: false, data: [] };
        }
    } catch (error) {
        console.error('[BudgetService - getBudgetStats] Error fetching budget stats:', error);
        // Return error object that can be handled by the component
        return { 
            error: true, 
            message: error.response?.data?.error || 'Failed to fetch budget data',
            data: [] 
        };
    }
};

const budgetService = {
    createBudget: async (budgetData) => {
        try {
            // Create a clean copy without empty string values
            const cleanBudgetData = Object.fromEntries(
                Object.entries(budgetData)
                    .filter(([key, value]) => value !== '')
            );
            
            // Map categoryId to category if needed
            if (cleanBudgetData.categoryId && !cleanBudgetData.category) {
                cleanBudgetData.category = cleanBudgetData.categoryId;
            }
            
            const response = await axiosInstance.post(API_URL, {
                ...cleanBudgetData,
                amount: parseFloat(cleanBudgetData.amount),
                currency: 'USD' // Default currency
            });
            return response.data;
        } catch (error) {
            const serverMessage = error.response?.data?.details || error.response?.data?.error;
            throw new Error(serverMessage || 'Budget validation failed');
        }
    },

    getUserBudgets: async (userId, filters = {}) => {
        try {
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`, { params: filters });
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

    getBudgetStats
};

export default budgetService;