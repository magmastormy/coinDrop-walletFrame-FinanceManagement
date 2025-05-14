import axiosInstance from "../api/userAxios";
const API_URL = '/saving-accounts';

export const savingsAccountService = {
    createSavingsAccount: async (accountData) => {
        try {
            const response = await axiosInstance.post(API_URL, accountData);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - createSavingsAccount] Error creating savings account:", error);
            throw error;
        }
    },

    getSavingsAccount: async (accountId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${accountId}`);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - getSavingsAccount] Error fetching savings account:", error);
            if (error.response?.status === 404) {
                console.log("[savingsAccountService - getSavingsAccount] Savings account not found for ID:", accountId);
                return null;
            }
            throw error;
        }
    },

    getUserSavingsAccounts: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/userId=${userId}`);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - getUserSavingsAccounts] Error fetching user savings accounts:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            if (error.response?.status === 404) {
                console.log("[savingsAccountService - getUserSavingsAccounts] No savings accounts found for user ID:", userId);
                return [];
            }
            throw error;
        }
    },

    transferToSavings: async (userId, amount, sourceWalletId, transferType) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/transfer`, {
                userId,
                amount,
                sourceWalletId,
                transferType // 'manual', 'automatic-amount', 'automatic-percentage'
            });
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - transferToSavings] Error transferring to savings:", error);
            throw error;
        }
    },

    withdrawFromSavings: async (userId, amount, targetWalletId) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/withdraw`, {
                userId,
                amount,
                targetWalletId
            });
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - withdrawFromSavings] Error withdrawing from savings:", error);
            throw error;
        }
    },

    setupAutomaticSavings: async (userId, config) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/automatic-setup`, {
                userId,
               ...config // frequency, amount/percentage, sourceWalletId
            });
            console.log("[savingsAccountService - setupAutomaticSavings] Automatic savings setup completed successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - setupAutomaticSavings] Error setting up automatic savings:", error);
            throw error;
        }
    },

    getSavingsTransactions: async (userId, page = 1, limit = 10) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/transactions/${userId}`, {
                params: { page, limit }
            });
            console.log("[savingsAccountService - getSavingsTransactions] Savings transactions fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - getSavingsTransactions] Error fetching savings transactions:", error);
            throw error;
        }
    },

    updateAutomaticSavings: async (userId, config) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/automatic-settings`, {
                userId,
               ...config
            });
            console.log("[savingsAccountService - updateAutomaticSavings] Automatic savings settings updated successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - updateAutomaticSavings] Error updating automatic savings settings:", error);
            throw error;
        }
    },

    updateSavingsAccount: async (accountId, updateData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${accountId}`, updateData);
            console.log("[savingsAccountService - updateSavingsAccount] Savings account updated successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - updateSavingsAccount] Error updating savings account:", error);
            throw error;
        }
    },

    deleteSavingsAccount: async (accountId, transferToWalletId) => {
        const operationId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        try {
            // Validate accountId
            if (!accountId) {
                console.error(`[savingsAccountService - deleteSavingsAccount][${operationId}] Missing account ID`);
                throw new Error('Account ID is required');
            }
            
            // Validate accountId format (should be a valid MongoDB ObjectId)
            if (!/^[0-9a-fA-F]{24}$/.test(accountId)) {
                console.error(`[savingsAccountService - deleteSavingsAccount][${operationId}] Invalid account ID format: ${accountId}`);
                throw new Error('Invalid account ID format');
            }
            
            // Validate transferToWalletId if provided
            if (transferToWalletId && !/^[0-9a-fA-F]{24}$/.test(transferToWalletId)) {
                console.error(`[savingsAccountService - deleteSavingsAccount][${operationId}] Invalid wallet ID format: ${transferToWalletId}`);
                throw new Error('Invalid wallet ID format');
            }
            
            console.log(`[savingsAccountService - deleteSavingsAccount][${operationId}] Deleting account ${accountId} and transferring balance to wallet ${transferToWalletId || 'none'}`);
            
            // Get current user from localStorage
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : {};
            const userId = user.id || user._id;
            
            const data = { 
                transferToWalletId: transferToWalletId || null,
                operationId: operationId,
                userId: userId
            };
            
            console.log(`[savingsAccountService - deleteSavingsAccount][${operationId}] Request data:`, data);
            
            // Add timeout and retry logic for network resilience
            const response = await axiosInstance.delete(`${API_URL}/${accountId}`, {
                data: data,
                timeout: 10000 // 10 second timeout
            });
            console.log(`[savingsAccountService - deleteSavingsAccount][${operationId}] Response received:`, response);
            
            if (!response) {
                console.error(`[savingsAccountService - deleteSavingsAccount][${operationId}] Invalid response received:`, response);
                throw new Error('Invalid response received from server');
            }
            
            console.log(`[savingsAccountService - deleteSavingsAccount][${operationId}] Account deleted successfully:`, response);
            
            // Return a normalized response with consistent fields
            return {
                success: true,
                message: 'Savings account deleted successfully',
                originalResponse: response
            };
        } catch (error) {
            console.error(`[savingsAccountService - deleteSavingsAccount][${operationId}] Error:`, error);
            throw {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to delete savings account',
                statusCode: error.response?.status || 500,
                details: error.response?.data?.details || error.message
            };
        }
    },

    // Consolidated savings transfer methods
    transferFunds: async ({ 
        accountId, 
        walletId, 
        amount, 
        description = 'Savings transfer', 
        direction = 'deposit' // 'deposit' or 'withdraw'
    }) => {
        try {
            // Normalize parameters
            const transferData = {
                walletId,
                amount: parseFloat(amount),
                description
            };
            
            // Determine the endpoint based on direction
            const endpoint = direction === 'withdraw' 
                ? `${API_URL}/${accountId}/withdraw`
                : `${API_URL}/${accountId}/deposit`;
                
            console.log(`[savingsAccountService - transferFunds] Performing ${direction} of ${amount} between wallet ${walletId} and account ${accountId}`);
            
            const response = await axiosInstance.post(endpoint, transferData);
            return response.data;
        } catch (error) {
            console.error(`[savingsAccountService - transferFunds] Error during ${direction}:`, error);
            throw error;
        }
    },

    // Deprecated methods (kept for backward compatibility)
    depositToSavings: async ({ accountId, walletId, amount }) => {
        console.warn('[savingsAccountService] depositToSavings is deprecated, use transferFunds instead');
        return savingsAccountService.transferFunds({ 
            accountId, 
            walletId, 
            amount, 
            direction: 'deposit' 
        });
    },

    withdrawFromSavings: async ({ accountId, walletId, amount }) => {
        console.warn('[savingsAccountService] withdrawFromSavings is deprecated, use transferFunds instead');
        return savingsAccountService.transferFunds({ 
            accountId, 
            walletId, 
            amount, 
            direction: 'withdraw' 
        });
    },

    createSavingsTransaction: async ({ accountId, amount, description, category }) => {
        const response = await axiosInstance.post(`${API_URL}/${accountId}/transactions`, {
            amount: parseFloat(amount),
            description,
            category
        });
        return response.data;
    },

    transferBetweenSavings: async ({ fromAccountId, toAccountId, amount }) => {
        try {            
            const response = await axiosInstance.post(`${API_URL}/transfer-between-accounts`, {
                fromAccountId,
                toAccountId,
                amount: parseFloat(amount)
            });
            
            console.log("[savingsAccountService - transferBetweenSavings] Transfer completed successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - transferBetweenSavings] Error transferring between savings accounts:", error);
            throw error;
        }
    },
};

export default savingsAccountService;