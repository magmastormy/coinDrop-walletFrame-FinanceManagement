import axiosInstance from '../api/userAxios';

const API_URL = '/transactions';

export const getUserTransactions = async (userId, filters = {}) => {
    try {
        const queryParams = new URLSearchParams({
            userId,
           ...filters
        }).toString();
        console.log(`[getUserTransactions] Fetching transactions with userId: ${userId} and filters: ${JSON.stringify(filters)}`);
        const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
        console.log(`[getUserTransactions] Transactions fetched successfully:`, response);
        return response;
    } catch (error) {
        console.error(`[getUserTransactions] Error fetching user transactions:`, error);
        throw error;
    }
};

const transactionService = {
    getUserTransactions: async (userId, filters = {}) => {
        try {
            const queryParams = new URLSearchParams({
                userId,
               ...filters
            }).toString();
            console.log(`[transactionService - getUserTransactions] Fetching transactions with userId: ${userId} and filters: ${JSON.stringify(filters)}`);
            const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
            console.log(`[transactionService - getUserTransactions] Transactions fetched successfully:`, response);
            return response; 
        } catch (error) {
            console.error("[transactionService - getUserTransactions] Error fetching transactions:", error);
            throw error;
        }
    },

    getAllUserTransactions: async (userId, filters = {}) => {
        try {
            console.log("[transactionService - getAllUserTransactions] Fetching all transactions for userId:", userId);
            const [walletTransactions, savingsTransactions] = await Promise.all([
                axiosInstance.get(`${API_URL}?${new URLSearchParams({ userId, type: 'wallet',...filters }).toString()}`),
                axiosInstance.get(`${API_URL}?${new URLSearchParams({ userId, type: 'savings',...filters }).toString()}`)
            ]).catch(error => {
                console.error("[transactionService - getAllUserTransactions] Error fetching transactions:", error);
                return [{ data: [] }, { data: [] }];
            });

            // Ensure data exists and is an array before mapping
            const walletData = Array.isArray(walletTransactions?.data)? walletTransactions.data : [];
            const savingsData = Array.isArray(savingsTransactions?.data)? savingsData.data : [];

            console.log("[transactionService - getAllUserTransactions] Wallet Data: ", walletData);
            console.log("[transactionService - getAllUserTransactions] Savings Data: ", savingsData);

            // Combine and sort transactions by date
            const allTransactions = [
               ...walletData.map(t => ({...t, source: 'wallet' })),
               ...savingsData.map(t => ({...t, source: 'savings' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            console.log("[transactionService - getAllUserTransactions] All Transactions: ", allTransactions);
            return allTransactions;
        } catch (error) {
            console.error("[transactionService - getAllUserTransactions] Error fetching all user transactions:", error);
            return [];
        }
    },

    createTransaction: async (transactionData) => {
        try {
            const response = await axiosInstance.post(API_URL, transactionData);
            return response.data;
        } catch (error) {
            console.error("[transactionService - createTransaction] Error creating transaction:", error);
            throw error;
        }
    },

    updateTransaction: async (id, transactionData) => {
        try {
            console.log(`[transactionService - updateTransaction] Updating transaction with id: ${id} and data:`, transactionData);
            const response = await axiosInstance.put(`${API_URL}/${id}`, transactionData);
            console.log("[transactionService - updateTransaction] Transaction updated successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[transactionService - updateTransaction] Error updating transaction:", error);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            console.log(`[transactionService - deleteTransaction] Deleting transaction with id: ${id}`);
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log("[transactionService - deleteTransaction] Transaction deleted successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[transactionService - deleteTransaction] Error deleting transaction:", error);
            throw error;
        }
    },

    getTransactionStats: async () => {
        try {
            console.log("[transactionService - getTransactionStats] Fetching transaction stats");
            const response = await axiosInstance.get(`${API_URL}/stats`);
            console.log("[transactionService - getTransactionStats] Transaction stats fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[transactionService - getTransactionStats] Error fetching transaction stats:", error);
            throw error;
        }
    },

    transferBalance: async (transferData) => {
        try {
            console.log("[transactionService - transferBalance] Transferring balance with data:", transferData);
            const response = await axiosInstance.post(`${API_URL}/transfer`, transferData);
            console.log("[transactionService - transferBalance] Balance transferred successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[transactionService - transferBalance] Error transferring balance:", error);
            throw error;
        }
    },

    getBudgetTransactions: async (budgetId) => {
        try {
            console.log(`[transactionService - getBudgetTransactions] Fetching transactions for budgetId: ${budgetId}`);
            const response = await axiosInstance.get(`${API_URL}/budget/${budgetId}`);
            console.log("[transactionService - getBudgetTransactions] Budget transactions fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[transactionService - getBudgetTransactions] Error fetching budget transactions:", error);
            throw error;
        }
    },

    createBudgetTransaction: async (budgetId, transactionData) => {
        try {
            console.log(`[transactionService - createBudgetTransaction] Creating transaction for budgetId: ${budgetId} with data:`, transactionData);
            const response = await axiosInstance.post(`${API_URL}/budget/${budgetId}`, transactionData);
            console.log("[transactionService - createBudgetTransaction] Budget transaction created successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[transactionService - createBudgetTransaction] Error creating budget transaction:", error);
            throw error;
        }
    }
};

export default transactionService;