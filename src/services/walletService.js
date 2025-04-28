import axiosInstance from '../api/userAxios';

const API_URL = '/wallets';

const walletService = {
    getAllWallets: async (userId) => {
        try {
            if (!userId) {
                throw new Error('UserId is required');
            }
            
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
            //TO DO & FIX Return the wallets array from response data
            return response.wallets || [];
        } catch (error) {
            console.error('Wallet Service - Error fetching wallets:', error);
            // Return empty array on error
            return [];
        }
    },
    getWalletBudgets: async (walletId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${walletId}/budgets`);
            return response;
        } catch (error) {
            console.error('Error fetching wallet budgets:', error);
            throw error;
        }
    },

    createWallet: async (walletData) => {
        const response = await axiosInstance.post(`${API_URL}`, walletData);
        return response.data;
    },

    updateWallet: async (id, walletData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${id}`, walletData);
            return response.data.wallet;
        } catch (error) {
            throw error;
        }
    },

    deleteWallet: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getWalletStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response;
    },

    transferBetweenWallets: async (fromWalletId, toWalletId, amount) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/transfer`, {
                fromWalletId,
                toWalletId,
                amount
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default walletService;