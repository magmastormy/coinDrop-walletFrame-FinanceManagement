import axiosInstance from '../api/userAxios';
const API_URL = '/saving-goals';

export const savingsGoalService = {
    // Create a new savings goal
    createSavingsGoal: async (goalData) => {
        try {
            const response = await axiosInstance.post(API_URL, goalData);
            console.log("[savingsGoalService - createSavingsGoal] Savings goal created successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsGoalService - createSavingsGoal] Error creating savings goal:", error);
            throw error;
        }
    },

    // Get all savings goals for a user
    getSavingsGoals: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${userId}`);
            console.log("[savingsGoalService - getSavingsGoals] Savings goals fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsGoalService - getSavingsGoals] Error fetching savings goals:", error);
            throw error;
        }
    },

    // Get specific savings goal
    getSavingsGoal: async (goalId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${goalId}`);
            console.log("[savingsGoalService - getSavingsGoal] Savings goal fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsGoalService - getSavingsGoal] Error fetching savings goal:", error);
            throw error;
        }
    },

    // Update savings goal
    updateSavingsGoal: async (goalId, updateData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${goalId}`, updateData);
            console.log("[savingsGoalService - updateSavingsGoal] Savings goal updated successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsGoalService - updateSavingsGoal] Error updating savings goal:", error);
            throw error;
        }
    },

    // Delete savings goal
    deleteSavingsGoal: async (goalId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${goalId}`);
            console.log("[savingsGoalService - deleteSavingsGoal] Savings goal deleted successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsGoalService - deleteSavingsGoal] Error deleting savings goal:", error);
            throw error;
        }
    },

    // Track progress towards goal
    trackGoalProgress: async (goalId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${goalId}/progress`);
            console.log("[savingsGoalService - trackGoalProgress] Goal progress tracked successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsGoalService - trackGoalProgress] Error tracking goal progress:", error);
            throw error;
        }
    },

    // Get completed goals history
    getCompletedGoals: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/completed/${userId}`);
            console.log("[savingsGoalService - getCompletedGoals] Completed goals fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsGoalService - getCompletedGoals] Error fetching completed goals:", error);
            throw error;
        }
    },

    contributeToGoal: async (goalId, contributionData) => {
        try {
            if (!goalId) {
                throw new Error('Goal ID is required');
            }
            
            const response = await axiosInstance.post(
                `${API_URL}/${goalId}/contribute`, 
                contributionData
            );
            
            console.log('[savingsGoalService - contributeToGoal] Successfully contributed to goal:', response.data);
            return response.data;
        } catch (error) {
            console.error('[savingsGoalService - contributeToGoal] Error contributing to goal:', error);
            throw error;
        }
    }
};

export default savingsGoalService;