import axiosInstance from '../api/userAxios';
const API_URL = '/saving-goals';

export const savingsGoalService = {
    // Create a new savings goal
    createSavingsGoal: async (goalData) => {
        try {
            const response = await axiosInstance.post(API_URL, goalData);
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
            return response.data;
        } catch (error) {
            console.error("[savingsGoalService - updateSavingsGoal] Error updating savings goal:", error);
            throw error;
        }
    },

    // Delete savings goal
    deleteSavingsGoal: async (goalId, transferOptions = {}) => {
        try {
            if (!goalId) {
                throw new Error('Goal ID is required');
            }
            
            // Validate goalId format (should be a valid MongoDB ObjectId)
            if (!/^[0-9a-fA-F]{24}$/.test(goalId)) {
                console.error(`[savingsGoalService - deleteSavingsGoal] Invalid goal ID format: ${goalId}`);
                throw new Error('Invalid goal ID format');
            }
            
            // Configure request with transfer options in the body
            const config = {
                data: transferOptions // Send transfer options in the request body
            };
            
            console.log(`[savingsGoalService - deleteSavingsGoal] Deleting goal ${goalId} with transfer options:`, transferOptions);
            const response = await axiosInstance.delete(`${API_URL}/${goalId}`, config);
            console.log("[savingsGoalService - deleteSavingsGoal] response: ", response);
            
            // Log success with status code
            console.log(`[savingsGoalService - deleteSavingsGoal] Savings goal deleted successfully (${response.status}):`, response.data);
            
            // Return the data portion of the response
            return response;
        } catch (error) {
            console.error("[savingsGoalService - deleteSavingsGoal] Error deleting savings goal:", error);
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
            }
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
            return response;
        } catch (error) {
            console.error('[savingsGoalService - contributeToGoal] Error contributing to goal:', error);
            throw error;
        }
    }
};

export default savingsGoalService;