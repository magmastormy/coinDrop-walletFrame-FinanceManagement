import { logWarn } from '../utils/logger';

import axiosInstance from '../api/userAxios';
import { makeRequest } from './apiRequestManager';
import ValidationUtils from '../utils/validationUtils';

const API_URL = '/transactions';

// Helper function to create stable cache keys
const createStableKey = (filters) => {
    const sortedKeys = Object.keys(filters).sort();
    const sortedFilters = {};
    sortedKeys.forEach(key => {
        sortedFilters[key] = filters[key];
    });
    return `transactions_${JSON.stringify(sortedFilters)}`;
};

export const getUserTransactions = async (userIdOrFilters = {}, maybeFilters = {}) => {
    const filters = typeof userIdOrFilters === 'object' ? userIdOrFilters : maybeFilters;
    const requestKey = createStableKey(filters);
    
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
        return response.data?.transactions || [];
    },

    createTransaction: async transactionData => {
        const payload = {
            amount: parseFloat(transactionData.amount) || 0,
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
            amount: parseFloat(transactionData.amount) || 0,
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
        return response.data?.stats || [];
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
        return response.data?.transactions || [];
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
        if (!csvContent || typeof csvContent !== 'string') {
            throw new Error('Invalid CSV content provided');
        }

        const lines = csvContent.split('\n').filter(line => line.trim()); // Remove empty lines
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header and one data row');
        }

        const headers = lines[0].split(',').map(header => header.trim());
        if (headers.length === 0) {
            throw new Error('CSV headers cannot be empty');
        }

        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const values = line.split(',').map(value => value.trim());
            
            // Validate row length
            if (values.length !== headers.length) {
                logWarn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping row.`);
                continue;
            }

            // Validate required fields
            const transaction = {};
            let hasValidData = false;

            headers.forEach((header, index) => {
                const value = values[index];
                const key = header.toLowerCase();
                
                if (value) {
                    hasValidData = true;
                }

                // Basic validation for common fields
                if (key === 'amount') {
                    const numValue = parseFloat(value);
                    transaction[key] = isNaN(numValue) ? 0 : numValue;
                } else if (key === 'date') {
                    const dateValue = new Date(value);
                    transaction[key] = isNaN(dateValue.getTime()) ? new Date().toISOString() : dateValue.toISOString();
                } else {
                    transaction[key] = value;
                }
            });

            // Only add transactions with some valid data
            if (hasValidData) {
                transactions.push(transaction);
            }
        }

        if (transactions.length === 0) {
            throw new Error('No valid transactions found in CSV');
        }

        return transactions;
    }
};

export default transactionService;
