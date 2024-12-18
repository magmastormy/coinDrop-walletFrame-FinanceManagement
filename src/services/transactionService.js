import axiosInstance from '../api/userAxios';

const API_URL = '/transactions';

const transactionService = {
    getUserTransactions: async (userId) => {
        console.log("Transaction Service - getAllTransactions - userId Received: ", userId);
        try {
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
            return response; 
        } catch (error) {
            console.error('Transaction Service - Error fetching transactions:', error);
            throw error; // Propagate the error for handling in the frontend
        }
    },

    createTransaction: async (transactionData) => {
        const response = await axiosInstance.post(API_URL, transactionData);
        return response.data;
    },

    updateTransaction: async (id, transactionData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, transactionData);
        return response.data;
    },

    deleteTransaction: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getTransactionStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.data;
    },

    transferBalance: async (transferData) => {
        const response = await axiosInstance.post(`${API_URL}/transfer`, transferData);
        return response.data;
    }
};

export default transactionService;