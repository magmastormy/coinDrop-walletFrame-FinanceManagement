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
        // Generate a unique operation ID for tracing this request
        const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        try {
            if (!goalId) {
                throw new Error('Goal ID is required');
            }
            
            // Validate goalId format (should be a valid MongoDB ObjectId)
            if (!/^[0-9a-fA-F]{24}$/.test(goalId)) {
                console.error(`[savingsGoalService - deleteSavingsGoal][${operationId}] Invalid goal ID format: ${goalId}`);
                throw new Error('Invalid goal ID format');
            }
            
            console.log(`[savingsGoalService - deleteSavingsGoal][${operationId}] Deleting goal ${goalId} and transferring balance to ${transferOptions.transferToWalletId ? 'wallet' : transferOptions.transferToSavingsAccountId ? 'savings account' : 'none'}`);
            
            // Get current user from localStorage
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : {};
            const userId = user.id || user._id;
        
            const data = { 
                ...transferOptions,
                operationId: operationId,
                userId: userId
            };
            
            console.log(`[savingsGoalService - deleteSavingsGoal][${operationId}] Request data:`, data);
            
            const response = await axiosInstance.delete(`${API_URL}/${goalId}`, {
                data: data,
                timeout: 10000
            });
            
            console.log(`[savingsGoalService - deleteSavingsGoal][${operationId}] Savings goal deleted successfully:`, response);
            
            return {
                success: true,
                message: 'Savings goal deleted successfully',
                data: response,
                operationId: operationId
            };
        } catch (error) {
            // Enhanced structured error logging
            const errorDetails = {
                operationId,
                timestamp: new Date().toISOString(),
                goalId,
                transferOptions: transferOptions || 'none',
                errorMessage: error.message,
                stack: error.stack
            };
            
            if (error.response) {
                errorDetails.responseStatus = error.response.status;
                errorDetails.responseData = error.response.data;
                errorDetails.requestUrl = error.config?.url;
                errorDetails.requestData = error.config?.data;
                
                console.error(`[savingsGoalService - deleteSavingsGoal][${operationId}] Response error:`, errorDetails);
            } else if (error.request) {
                errorDetails.requestObject = error.request;
                console.error(`[savingsGoalService - deleteSavingsGoal][${operationId}] Network error - no response received:`, errorDetails);
            } else {
                console.error(`[savingsGoalService - deleteSavingsGoal][${operationId}] Request setup error:`, errorDetails);
            }
            
            // Return a normalized error response
            const errorResponse = {
                success: false,
                message: 'Failed to delete savings goal',
                error: error.message,
                details: error.response?.data?.details || error.message,
                statusCode: error.response?.status || 500,
                operationId: operationId,
                goalId: goalId
            };
            
            throw errorResponse;
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