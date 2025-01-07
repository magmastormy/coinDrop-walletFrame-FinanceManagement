import axiosInstance from '../api/userAxios';

const API_URL = '/transactions';

export const getUserTransactions = async (userId, filters = {}) => {
    try {
        const queryParams = new URLSearchParams({
            userId,
            ...filters
        }).toString();

        const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
        return response;
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        throw error;
    }
};

const transactionService = {
    getUserTransactions: async (userId, filters = {}) => {
        console.log("Transaction Service - getAllTransactions - userId Received: ", userId);
        try {
            const queryParams = new URLSearchParams({
                userId,
                ...filters
            }).toString();

            const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
            return response; 
        } catch (error) {
            console.error('Transaction Service - Error fetching transactions:', error);
            throw error;
        }
    },

    getAllUserTransactions: async (userId, filters = {}) => {
        try {
            // Get both wallet and savings transactions
            const [walletTransactions, savingsTransactions] = await Promise.all([
                axiosInstance.get(`${API_URL}?${new URLSearchParams({ userId, type: 'wallet', ...filters }).toString()}`),
                axiosInstance.get(`${API_URL}?${new URLSearchParams({ userId, type: 'savings', ...filters }).toString()}`)
            ]).catch(error => {
                console.error('Error fetching transactions:', error);
                return [{ data: [] }, { data: [] }];
            });

            // Ensure data exists and is an array before mapping
            const walletData = Array.isArray(walletTransactions?.data) ? walletTransactions.data : [];
            const savingsData = Array.isArray(savingsTransactions?.data) ? savingsTransactions.data : [];

            console.log("transactionService - getAllUserTransactions - Wallet Data: ", walletData);
            console.log("transactionService - getAllUserTransactions - Savings Data: ", savingsData);

            // Combine and sort transactions by date
            const allTransactions = [
                ...walletData.map(t => ({ ...t, source: 'wallet' })),
                ...savingsData.map(t => ({ ...t, source: 'savings' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            console.log("transactionService - getAllUserTransactions - All Transactions: ", allTransactions);
            return allTransactions;
        } catch (error) {
            console.error('Error fetching all user transactions:', error);
            return []; // Return empty array instead of throwing
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
    },

    getBudgetTransactions: async (budgetId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/budget/${budgetId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching budget transactions:', error);
            throw error;
        }
    },

    createBudgetTransaction: async (budgetId, transactionData) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/budget/${budgetId}`, transactionData);
            return response.data;
        } catch (error) {
            console.error('Error creating budget transaction:', error);
            throw error;
        }
    }
};

export default transactionService;