import axiosInstance from '../api/userAxios';
const API_URL = '/saving-accounts';

export const savingsAccountService = {
    createSavingsAccount: async accountData => {
        const response = await axiosInstance.post(API_URL, accountData);
        return response;
    },

    getSavingsAccount: async accountId => {
        try {
            const response = await axiosInstance.get(`${API_URL}/account/${accountId}`);
            return response;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    getUserSavingsAccounts: async () => {
        const response = await axiosInstance.get(API_URL);
        return Array.isArray(response) ? response : [];
    },

    updateSavingsAccount: async (accountId, updateData) => {
        const response = await axiosInstance.put(`${API_URL}/${accountId}`, updateData);
        return response;
    },

    updateTransaction: async (transactionId, updateData) => {
        const response = await axiosInstance.put(`${API_URL}/transactions/${transactionId}`, updateData);
        return response;
    },

    deleteSavingsAccount: async (accountId, transferToWalletId = null) => {
        const response = await axiosInstance.delete(`${API_URL}/${accountId}`, {
            data: transferToWalletId ? { transferToWalletId } : {}
        });

        return {
            success: true,
            ...response
        };
    },

    transferFunds: async ({ accountId, walletId, amount, direction = 'deposit', description = 'Savings transfer' }) => {
        const endpoint = direction === 'withdraw'
            ? `${API_URL}/${accountId}/withdraw`
            : `${API_URL}/${accountId}/deposit`;

        const response = await axiosInstance.post(endpoint, {
            walletId,
            amount: parseFloat(amount),
            description
        });

        return response;
    },

    depositToSavings: async ({ accountId, walletId, amount }) => {
        return savingsAccountService.transferFunds({ accountId, walletId, amount, direction: 'deposit' });
    },

    withdrawFromSavings: async ({ accountId, walletId, amount }) => {
        return savingsAccountService.transferFunds({ accountId, walletId, amount, direction: 'withdraw' });
    },

    transferBetweenSavings: async ({ fromAccountId, toAccountId, amount }) => {
        const response = await axiosInstance.post(`${API_URL}/transfer-between-accounts`, {
            fromAccountId,
            toAccountId,
            amount: parseFloat(amount)
        });

        return response;
    },

    createSavingsTransaction: async ({ accountId, amount, description, category }) => {
        const response = await axiosInstance.post(`${API_URL}/${accountId}/transactions`, {
            amount: parseFloat(amount),
            description,
            category
        });
        return response;
    },

    getSavingsTransactions: async userId => {
        const response = await axiosInstance.get(`${API_URL}/transactions/${userId}`);
        return response;
    },

    transferToSavings: async (_userId, amount, sourceWalletId) => {
        const response = await axiosInstance.post(`${API_URL}/transfer`, {
            amount,
            sourceWalletId
        });
        return response;
    },

    withdrawFromSavingsLegacy: async (_userId, amount, targetWalletId) => {
        const response = await axiosInstance.post(`${API_URL}/withdraw`, {
            amount,
            targetWalletId
        });
        return response;
    },

    setupAutomaticSavings: async (_userId, config) => {
        const response = await axiosInstance.post(`${API_URL}/automatic-setup`, config);
        return response;
    },

    updateAutomaticSavings: async (_userId, config) => {
        const response = await axiosInstance.put(`${API_URL}/automatic-settings`, config);
        return response;
    },

    getAutoTransferSettings: async () => {
        const response = await axiosInstance.get(`${API_URL}/automatic-settings`);
        return response;
    },

    deleteAutoTransfer: async (transferId) => {
        const response = await axiosInstance.delete(`${API_URL}/automatic-settings/${transferId}`);
        return response;
    },

    updateGoalBasedSavings: async (goalId, config) => {
        const response = await axiosInstance.put(`${API_URL}/goal-based/${goalId}`, config);
        return response;
    },

    getGoalBasedSavings: async (goalId) => {
        const response = await axiosInstance.get(`${API_URL}/goal-based/${goalId}`);
        return response;
    }
};

export default savingsAccountService;
