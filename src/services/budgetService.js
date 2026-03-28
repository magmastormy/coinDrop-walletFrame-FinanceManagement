import axiosInstance from '../api/userAxios';

const API_URL = '/budgets';

export const getUserBudgets = async (userIdOrFilters = {}, maybeFilters = {}) => {
    const filters = typeof userIdOrFilters === 'object' ? userIdOrFilters : maybeFilters;
    const response = await axiosInstance.get(API_URL, { params: filters });
    return response.budgets || [];
};

export const getBudgetStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.chartData || [];
    } catch (error) {
        console.error('[BudgetService - getBudgetStats] Error fetching budget stats:', error);
        return [];
    }
};

const budgetService = {
    createBudget: async budgetData => {
        // Create clean budget data, preserving the automation object
        const cleanBudgetData = Object.fromEntries(
            Object.entries(budgetData).filter(([key, value]) => {
                // Preserve automation object even if it's empty
                if (key === 'automation') return true;
                // Filter out other empty values
                return value !== '';
            })
        );

        if (cleanBudgetData.categoryId && !cleanBudgetData.category) {
            cleanBudgetData.category = cleanBudgetData.categoryId;
        }

        const response = await axiosInstance.post(API_URL, {
            ...cleanBudgetData,
            amount: parseFloat(cleanBudgetData.amount)
        });

        return response.budget;
    },

    getUserBudgets,

    updateBudget: async (id, budgetData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, budgetData);
        return response.budget;
    },

    deleteBudget: async id => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response;
    },

    getBudgetStats,

    renewRecurringBudgets: async () => {
        const response = await axiosInstance.post(`${API_URL}/renew`);
        return response;
    },

    checkBudgetAlerts: async () => {
        const response = await axiosInstance.get(`${API_URL}/alerts`);
        return response.alerts || [];
    },

    getUncategorizedTransactions: async () => {
        const response = await axiosInstance.get(`${API_URL}/uncategorized-transactions`);
        return response.transactions || [];
    }
};

export default budgetService;
