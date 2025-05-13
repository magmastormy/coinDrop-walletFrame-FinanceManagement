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
        try {
            // Validate accountId
            if (!accountId) {
                throw new Error('Account ID is required');
            }
            
            // Validate accountId format (should be a valid MongoDB ObjectId)
            if (!/^[0-9a-fA-F]{24}$/.test(accountId)) {
                console.error(`[savingsAccountService - deleteSavingsAccount] Invalid account ID format: ${accountId}`);
                throw new Error('Invalid account ID format');
            }
            
            // Validate transferToWalletId if provided
            if (transferToWalletId && !/^[0-9a-fA-F]{24}$/.test(transferToWalletId)) {
                console.error(`[savingsAccountService - deleteSavingsAccount] Invalid wallet ID format: ${transferToWalletId}`);
                throw new Error('Invalid wallet ID format');
            }
            
            console.log(`[savingsAccountService - deleteSavingsAccount] Deleting account ${accountId} and transferring balance to wallet ${transferToWalletId || 'none'}`);
            
            const data = { 
                transferToWalletId: transferToWalletId || null
                // Don't include userId in the request body as it should be taken from the auth token
            };
            
            console.log(`[savingsAccountService - deleteSavingsAccount] Request data:`, data);
            
            // Make sure the auth token is being sent in the headers (handled by axiosInstance)
            const response = await axiosInstance.delete(`${API_URL}/${accountId}`, {
                data: data
            });
            
            console.log("[savingsAccountService - deleteSavingsAccount] Account deleted successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - deleteSavingsAccount] Error deleting savings account:", error);
            
            // Enhanced error logging
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
                console.error("Request URL:", error.config?.url);
                console.error("Request data:", error.config?.data);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error setting up request:", error.message);
            }
            
            throw error;
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