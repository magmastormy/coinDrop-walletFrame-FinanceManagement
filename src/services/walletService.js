import axiosInstance from '../api/userAxios';

const API_URL = '/wallets';

const walletService = {
    getAllWallets: async () => {
        try {
            const response = await axiosInstance.get(API_URL);
            return response.wallets || [];
        } catch (error) {
            console.error('Wallet Service - Error fetching wallets:', error);
            return [];
        }
    },

    getWalletBudgets: async walletId => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${walletId}/budgets`);
            return response.budgets || [];
        } catch (error) {
            console.error('Error fetching wallet budgets:', error);
            throw error;
        }
    },

    createWallet: async walletData => {
        const response = await axiosInstance.post(API_URL, walletData);
        return response.wallet;
    },

    updateWallet: async (id, walletData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, walletData);
        return response.wallet;
    },

    deleteWallet: async (id, transferToWalletId = null) => {
        const config = transferToWalletId ? { data: { transferToWalletId } } : {};
        const response = await axiosInstance.delete(`${API_URL}/${id}`, config);
        return response;
    },

    getWalletStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.stats || [];
    },

    transferBetweenWallets: async (fromWalletId, toWalletId, amount) => {
        const response = await axiosInstance.post(`${API_URL}/transfer`, {
            fromWalletId,
            toWalletId,
            amount
        });
        return response;
    }
};

export default walletService;
