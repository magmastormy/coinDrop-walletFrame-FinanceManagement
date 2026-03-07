import axiosInstance from '../api/userAxios';
const API_URL = '/saving-goals';

export const savingsGoalService = {
    createSavingsGoal: async goalData => {
        const response = await axiosInstance.post(API_URL, goalData);
        return response;
    },

    getSavingsGoals: async () => {
        const response = await axiosInstance.get(API_URL);
        return Array.isArray(response) ? response : [];
    },

    getSavingsGoal: async goalId => {
        const response = await axiosInstance.get(`${API_URL}/${goalId}`);
        return response;
    },

    updateSavingsGoal: async (goalId, updateData) => {
        const response = await axiosInstance.put(`${API_URL}/${goalId}`, updateData);
        return response;
    },

    deleteSavingsGoal: async (goalId, transferOptions = {}) => {
        const response = await axiosInstance.delete(`${API_URL}/${goalId}`, {
            data: transferOptions
        });
        return response;
    },

    contributeToGoal: async (goalId, contributionData) => {
        const payload = typeof contributionData === 'object'
            ? contributionData
            : { amount: contributionData };

        const response = await axiosInstance.post(`${API_URL}/${goalId}/contribute`, payload);
        return response;
    },

    // Backward-compatible aliases
    getUserGoals: async () => savingsGoalService.getSavingsGoals(),
    createGoal: async data => savingsGoalService.createSavingsGoal(data),
    updateGoal: async (id, data) => savingsGoalService.updateSavingsGoal(id, data),
    deleteGoal: async id => savingsGoalService.deleteSavingsGoal(id)
};

export default savingsGoalService;
