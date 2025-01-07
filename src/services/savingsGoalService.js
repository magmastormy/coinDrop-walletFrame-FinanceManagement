
import axiosInstance from '../api/userAxios';
const API_URL = '/saving-goals';

export const savingsGoalService = {
    // Create a new savings goal
    createSavingsGoal: async (goalData) => {
        try {
            const response = await axiosInstance.post(API_URL, goalData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get all savings goals for a user
    getSavingsGoals: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user/${userId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get specific savings goal
    getSavingsGoal: async (goalId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${goalId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update savings goal
    updateSavingsGoal: async (goalId, updateData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${goalId}`, updateData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete savings goal
    deleteSavingsGoal: async (goalId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${goalId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Track progress towards goal
    trackGoalProgress: async (goalId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${goalId}/progress`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get completed goals history
    getCompletedGoals: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/completed/${userId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default savingsGoalService;
