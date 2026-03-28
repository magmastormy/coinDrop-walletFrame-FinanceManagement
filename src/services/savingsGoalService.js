import axiosInstance from '../api/userAxios';
const API_URL = '/saving-goals';

export const savingsGoalService = {
    createSavingsGoal: async goalData => {
        const response = await axiosInstance.post(API_URL, goalData);
        return response.data;
    },

    getSavingsGoals: async () => {
        const response = await axiosInstance.get(API_URL);
        return Array.isArray(response.data) ? response.data : [];
    },

    getSavingsGoal: async goalId => {
        const response = await axiosInstance.get(`${API_URL}/${goalId}`);
        return response.data;
    },

    updateSavingsGoal: async (goalId, updateData) => {
        const response = await axiosInstance.put(`${API_URL}/${goalId}`, updateData);
        return response.data;
    },

    deleteSavingsGoal: async (goalId, transferOptions = {}) => {
        const response = await axiosInstance.delete(`${API_URL}/${goalId}`, {
            data: transferOptions
        });
        return response.data;
    },

    contributeToGoal: async (goalId, contributionData) => {
        const payload = typeof contributionData === 'object'
            ? contributionData
            : { amount: contributionData };

        const response = await axiosInstance.post(`${API_URL}/${goalId}/contribute`, payload);
        return response.data;
    },

    // Backward-compatible aliases
    getUserGoals: async () => savingsGoalService.getSavingsGoals(),
    createGoal: async data => savingsGoalService.createSavingsGoal(data),
    updateGoal: async (id, data) => savingsGoalService.updateSavingsGoal(id, data),
    deleteGoal: async id => savingsGoalService.deleteSavingsGoal(id),

    // New recommendation generation
    generateRecommendations: async ({ goals, wallets }) => {
        try {
            const response = await axiosInstance.post('/saving-goals/recommendations', {
                goals,
                wallets
            });
            return response.data?.recommendations || [];
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return [];
        }
    }
};

export default savingsGoalService;
