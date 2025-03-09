import axiosInstance from "../api/userAxios";
const API_URL = '/saving-accounts';

export const savingsAccountService = {
    createSavingsAccount: async (accountData) => {
        try {
            console.log("[savingsAccountService - createSavingsAccount] Savings account data:", accountData);
            const response = await axiosInstance.post(API_URL, accountData);
            console.log("[savingsAccountService - createSavingsAccount] Savings account created successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - createSavingsAccount] Error creating savings account:", error);
            throw error;
        }
    },

    getSavingsAccount: async (accountId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${accountId}`);
            console.log("[savingsAccountService - getSavingsAccount] Savings account fetched successfully:", response);
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
            console.log("[savingsAccountService - getUserSavingsAccounts] User savings accounts fetched successfully:", response);
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
            console.log("[savingsAccountService - transferToSavings] Transfer to savings completed successfully:", response.data);
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
            console.log("[savingsAccountService - withdrawFromSavings] Withdrawal from savings completed successfully:", response.data);
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
            console.log(`[savingsAccountService - deleteSavingsAccount] Deleting account ${accountId} and transferring balance to wallet ${transferToWalletId || 'none'}`);
            
            // Get the current user ID from your auth context
            const userId = localStorage.getItem('userId'); // Or however you store the current user ID
            
            const data = { 
                transferToWalletId: transferToWalletId || null,
                userId // Include userId in the request as a fallback
            };
            
            console.log(`[savingsAccountService - deleteSavingsAccount] Request data:`, data);
            
            const response = await axiosInstance.delete(`${API_URL}/${accountId}`, {
                data: data
            });
            
            console.log("[savingsAccountService - deleteSavingsAccount] Account deleted successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - deleteSavingsAccount] Error deleting savings account:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
    },

    depositToSavings: async ({ accountId, walletId, amount }) => {
        const response = await axiosInstance.post(`${API_URL}/${accountId}/deposit`, {
            walletId,
            amount: parseFloat(amount)
        });
        return response.data;
    },

    withdrawFromSavings: async ({ accountId, walletId, amount }) => {
        const response = await axiosInstance.post(`${API_URL}/${accountId}/withdraw`, {
            walletId,
            amount: parseFloat(amount)
        });
        return response.data;
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