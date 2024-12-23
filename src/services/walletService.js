import axiosInstance from '../api/userAxios';

const API_URL = '/wallets';

const walletService = {
    getAllWallets: async (userId) => {
        console.log("Wallet Service - getAllWallets - userId Received: ", userId);
        try {
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
            return response; 
        } catch (error) {
            console.error('Wallet Service - Error fetching wallets:', error);
            throw error; // Propagate the error for handling in the frontend
        }
    },
    getWalletBudgets: async (walletId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${walletId}/budgets`);
            return response.data;
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
        const response = await axiosInstance.put(`${API_URL}/${id}`, walletData);
        return response.data;
    },

    deleteWallet: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getWalletStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.data;
    },

    transferBalance: async (transferData) => {
        const response = await axiosInstance.post(`${API_URL}/transfer`, transferData);
        return response.data;
    }

};

export default walletService;