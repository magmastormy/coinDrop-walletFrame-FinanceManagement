import axiosInstance from '../api/userAxios';
import { makeRequest } from './apiRequestManager';

const API_URL = '/transactions';

export const getUserTransactions = async (userIdOrFilters = {}, maybeFilters = {}) => {
    const filters = typeof userIdOrFilters === 'object' ? userIdOrFilters : maybeFilters;
    const requestKey = `transactions_${JSON.stringify(filters)}`;
    
    return makeRequest(requestKey, async () => {
        const response = await axiosInstance.get(API_URL, { params: filters });
        return response.data;
    });
};

const transactionService = {
    getUserTransactions,

    getAllUserTransactions: async (userIdOrFilters = {}, maybeFilters = {}) => {
        const filters = typeof userIdOrFilters === 'object' ? userIdOrFilters : maybeFilters;
        const response = await axiosInstance.get(API_URL, { params: { ...filters, limit: 1000 } });
        return response.transactions || [];
    },

    createTransaction: async transactionData => {
        const payload = {
            amount: parseFloat(transactionData.amount),
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            date: transactionData.date,
            walletId: transactionData.walletId,
            savingsAccountId: transactionData.savingsAccountId,
            budgetId: transactionData.budgetId
        };

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
                delete payload[key];
            }
        });

        const response = await axiosInstance.post(API_URL, payload);
        return response;
    },

    updateTransaction: async (id, transactionData) => {
        const payload = {
            amount: parseFloat(transactionData.amount),
            type: transactionData.type,
            category: transactionData.category,
            description: transactionData.description,
            date: transactionData.date,
            walletId: transactionData.walletId,
            savingsAccountId: transactionData.savingsAccountId,
            budgetId: transactionData.budgetId
        };

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
                delete payload[key];
            }
        });

        const response = await axiosInstance.put(`${API_URL}/${id}`, payload);
        return response;
    },

    deleteTransaction: async id => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response;
    },

    getTransactionStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.stats || [];
    },

    transferBalance: async transferData => {
        const response = await axiosInstance.post(`${API_URL}/transfer`, transferData);
        return response;
    },

    getBudgetTransactions: async budgetId => {
        try {
            const response = await axiosInstance.get(`${API_URL}/budget/${budgetId}`);
            return response;
        } catch (error) {
            if (error?.response?.status === 404) {
                return { transactions: [] };
            }
            throw error;
        }
    },

    createBudgetTransaction: async (budgetId, transactionData) => {
        const response = await axiosInstance.post(`${API_URL}/budget/${budgetId}`, transactionData);
        return response;
    },

    getUncategorizedTransactions: async () => {
        const response = await axiosInstance.get(`${API_URL}/uncategorized`);
        return response.transactions || [];
    },

    bulkUpdate: async (transactionIds, updateData) => {
        const response = await axiosInstance.patch(`${API_URL}/bulk-update`, {
            transactionIds,
            updateData
        });
        return response.data;
    },

    bulkDelete: async (transactionIds) => {
        const response = await axiosInstance.post(`${API_URL}/bulk-delete`, {
            transactionIds
        });
        return response.data;
    },

    importTransactionsFromCSV: async (formData) => {
        const response = await axiosInstance.post(`${API_URL}/import-csv`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    parseCSV: (csvContent) => {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length === headers.length) {
                const transaction = {};
                headers.forEach((header, index) => {
                    transaction[header.toLowerCase()] = values[index];
                });
                transactions.push(transaction);
            }
        }
        return transactions;
    }
};

export default transactionService;
