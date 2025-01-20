import axiosInstance from "../api/userAxios";
const API_URL = '/saving-accounts';

export const savingsAccountService = {
    // Create a new savings account
    createSavingsAccount: async (accountData) => {
        try {
            const response = await axiosInstance.post(API_URL, accountData);
            return response.data;
        } catch (error) {
            console.error('Error creating savings account:', error);
            throw error;
        }
    },

    // Get savings account details
    getSavingsAccount: async (accountId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${accountId}`);
            return response;
        } catch (error) {
            console.error('Error fetching savings account:', error);
            // Return null instead of throwing error for 404
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // Get user savings accounts
    getUserSavingsAccounts: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user/${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching user savings accounts:', error);
            // Return empty array instead of throwing error
            if (error.response?.status === 404) {
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
            return response.data;
        } catch (error) {
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
            return response.data;
        } catch (error) {
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
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get savings transactions
    getSavingsTransactions: async (userId, page = 1, limit = 10) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/transactions/${userId}`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
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
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update savings account
    updateSavingsAccount: async (accountId, updateData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${accountId}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Error updating savings account:', error);
            throw error;
        }
    },

    // Delete savings account
    deleteSavingsAccount: async (accountId) => {
        try {
            // First fetch the account to check if it's the default "Savings" account
            const account = await axiosInstance.get(`${API_URL}/${accountId}`);
            if (account.data.name === "Savings") {
                throw new Error("Cannot delete the default 'Savings' account");
            }
            const response = await axiosInstance.delete(`${API_URL}/${accountId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting savings account:', error);
            throw error;
        }
    },
};

export default savingsAccountService;