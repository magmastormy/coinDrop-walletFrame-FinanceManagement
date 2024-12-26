import axiosInstance from '../api/userAxios';

const API_URL = '/transactions';

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

const getBudgetTransactions = async (budgetId) => {
    try {
        const response = await fetch(`/api/transactions/budget/${budgetId}`, {
            headers: getAuthHeader()
        });
        return handleResponse(response);
    } catch (error) {
        throw error;
    }
};

const createBudgetTransaction = async (budgetId, transactionData) => {
    try {
        const response = await fetch(`/api/transactions/budget/${budgetId}`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        return handleResponse(response);
    } catch (error) {
        throw error;
    }
};

export {
    getBudgetTransactions,
    createBudgetTransaction
};

export default transactionService;