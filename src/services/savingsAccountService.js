import axiosInstance from "../api/userAxios";
const API_URL = '/saving-accounts';

export const savingsAccountService = {
    // Create a new savings account
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

    // Get savings account details
    getSavingsAccount: async (accountId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${accountId}`);
            console.log("[savingsAccountService - getSavingsAccount] Savings account fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - getSavingsAccount] Error fetching savings account:", error);
            // Return null instead of throwing error for 404
            if (error.response?.status === 404) {
                console.log("[savingsAccountService - getSavingsAccount] Savings account not found for ID:", accountId);
                return null;
            }
            throw error;
        }
    },

    // Get user savings accounts
    getUserSavingsAccounts: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/userId=${userId}`);
            console.log("[savingsAccountService - getUserSavingsAccounts] User savings accounts fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[savingsAccountService - getUserSavingsAccounts] Error fetching user savings accounts:", error);
            // Return empty array instead of throwing error
            if (error.response) {
                // Log the error response for debugging
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

    // Transfer money to savings
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

    // Withdraw from savings
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

    // Set up automatic savings
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

    // Get savings transactions
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

    // Update automatic savings settings
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

    // Update savings account
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

    // Delete savings account
    deleteSavingsAccount: async (accountId) => {
        try {
            // First fetch the account to check if it's the default "Savings" account
            const account = await axiosInstance.get(`${API_URL}/${accountId}`);
            if (account.data.name === "Savings") {
                console.error("[savingsAccountService - deleteSavingsAccount] Cannot delete the default 'Savings' account");
                throw new Error("Cannot delete the default 'Savings' account");
            }
            const response = await axiosInstance.delete(`${API_URL}/${accountId}`);
            console.log("[savingsAccountService - deleteSavingsAccount] Savings account deleted successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[savingsAccountService - deleteSavingsAccount] Error deleting savings account:", error);
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
};

export default savingsAccountService;