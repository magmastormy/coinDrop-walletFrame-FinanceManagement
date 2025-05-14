import axiosInstance from '../api/userAxios';

const API_URL = '/transactions';

export const getUserTransactions = async (userId, filters = {}) => {
    try {
        const queryParams = new URLSearchParams({
            userId,
           ...filters
        }).toString();
        //console.log(`[getUserTransactions] Fetching transactions with userId: ${userId} and filters: ${JSON.stringify(filters)}`);
        const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
        return response;
    } catch (error) {
        console.error(`[getUserTransactions] Error fetching user transactions:`, error);
        throw error;
    }
};

const transactionService = {
    getUserTransactions: async (userId, filters = {}) => {
        try {
            // Always request a high limit to get all transactions
            const enhancedFilters = {
                ...filters,
                limit: 1000, // Set a very high limit to get all transactions
                noLimit: true // Add a flag for the backend to ignore pagination limits
            };
            
            const queryParams = new URLSearchParams({
                userId,
                ...enhancedFilters
            }).toString();
            
            console.log(`[transactionService - getUserTransactions] Fetching transactions with userId: ${userId} and filters:`, enhancedFilters);
            const response = await axiosInstance.get(`${API_URL}?${queryParams}`);
            
            // Log the full response structure to debug
            console.log('[transactionService - getUserTransactions] Response structure:', response);
            
            // Count transactions based on the actual response structure
            const transactionCount = response?.data?.transactions?.length || 
                                    (Array.isArray(response?.data) ? response.data.length : 0) || 0;
            
            console.log(`[transactionService - getUserTransactions] Received ${transactionCount} transactions`);
            return response; 
        } catch (error) {
            console.error("[transactionService - getUserTransactions] Error fetching transactions:", error);
            throw error;
        }
    },

    getAllUserTransactions: async (userId, filters = {}) => {
        try {
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

            // Combine and sort transactions by date
            const allTransactions = [
               ...walletData.map(t => ({...t, source: 'wallet' })),
               ...savingsData.map(t => ({...t, source: 'savings' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            return allTransactions;
        } catch (error) {
            console.error("[transactionService - getAllUserTransactions] Error fetching all user transactions:", error);
            return [];
        }
    },

    createTransaction: async (transactionData) => {
        try {
            // Check if transactionData is already a response object (to prevent double calls)
            if (transactionData && transactionData.message && transactionData.transaction) {
                console.log("[transactionService - createTransaction] Received response object instead of transaction data, returning directly");
                return transactionData;
            }
            
            if (!transactionData) {
                throw new Error('Transaction data is required');
            }
            
            // Create a clean payload with all necessary fields
            console.log("[transactionService - createTransaction] Creating transaction with data:", transactionData);
            const payload = {
                amount: transactionData.amount,
                type: transactionData.type,
                category: transactionData.category,
                description: transactionData.description,
                date: transactionData.date,
            };
            
            // Add either walletId or savingsAccountId, but not both
            if (transactionData.walletId && transactionData.walletId !== '[object Object]') {
                payload.walletId = transactionData.walletId;
            } else if (transactionData.savingsAccountId && transactionData.savingsAccountId !== '[object Object]') {
                payload.savingsAccountId = transactionData.savingsAccountId;
            }
            
            // Add budgetId if present
            if (transactionData.budgetId) {
                payload.budgetId = transactionData.budgetId;
            }
            
            // Remove undefined/null/empty string fields
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined || payload[key] === null || payload[key] === '' || payload[key] === '[object Object]') {
                    delete payload[key];
                }
            });
            
            // Validate required fields before sending
            if (!payload.amount || !payload.type) {
                throw new Error('Amount and type are required');
            }
            
            console.log("[transactionService - createTransaction] - payload: ", payload);
            // Send a single request with the clean payload
            const response = await axiosInstance.post(API_URL, payload);

            console.log("[transactionService - createTransaction] response: ", response);
            return response.data; // Return response.data instead of the full response
        } catch (error) {
            console.error("[transactionService - createTransaction] Error creating transaction:", error);
            throw error;
        }
    },

    updateTransaction: async (id, transactionData) => {
        try {
            console.log("[transactionService - updateTransaction] Updating transaction with id:", id, "and data:", transactionData);
            
            if (!id) {
                throw new Error('Transaction ID is required for updates');
            }
            
            // Check if transactionData is already a response object (to prevent double calls)
            if (transactionData && transactionData.message && transactionData.transaction) {
                console.log("[transactionService - updateTransaction] Received response object instead of transaction data, returning directly");
                return transactionData;
            }
            
            if (!transactionData) {
                throw new Error('Transaction data is required');
            }
            
            // Create a clean payload with all necessary fields
            const payload = {
                amount: transactionData.amount,
                type: transactionData.type,
                category: transactionData.category,
                description: transactionData.description,
                date: transactionData.date,
            };
            
            // Add either walletId or savingsAccountId, but not both
            if (transactionData.walletId && transactionData.walletId !== '[object Object]') {
                payload.walletId = transactionData.walletId;
            } else if (transactionData.savingsAccountId && transactionData.savingsAccountId !== '[object Object]') {
                payload.savingsAccountId = transactionData.savingsAccountId;
            }
            
            // Add budgetId if present
            if (transactionData.budgetId) {
                payload.budgetId = transactionData.budgetId;
            }
            
            // Remove undefined/null/empty string fields
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined || payload[key] === null || payload[key] === '' || payload[key] === '[object Object]') {
                    delete payload[key];
                }
            });
            
            // Validate required fields before sending
            if (!payload.amount || !payload.type) {
                throw new Error('Amount and type are required');
            }
            
            console.log("[transactionService - updateTransaction] - payload: ", payload);
            
            // Use PUT instead of PATCH to avoid CORS issues
            const response = await axiosInstance.put(`${API_URL}/${id}`, payload);
            console.log("[transactionService - updateTransaction] response: ", response);
            
            return response.data; // Return response.data instead of the full response
        } catch (error) {
            console.error("[transactionService - updateTransaction] Error updating transaction:", error);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            return response;
        } catch (error) {
            console.error("[transactionService - deleteTransaction] Error deleting transaction:", error);
            throw error;
        }
    },

    getTransactionStats: async () => {
        try {
            //console.log("[transactionService - getTransactionStats] Fetching transaction stats");
            const response = await axiosInstance.get(`${API_URL}/stats`);
            //console.log("[transactionService - getTransactionStats] Transaction stats fetched successfully:", response);
            return response;
        } catch (error) {
            console.error("[transactionService - getTransactionStats] Error fetching transaction stats:", error);
            throw error;
        }
    },

    transferBalance: async (transferData) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/transfer`, transferData);
            return response.data;
        } catch (error) {
            console.error("[transactionService - transferBalance] Error transferring balance:", error);
            throw error;
        }
    },

    getBudgetTransactions: async (budgetId) => {
        try {
            //console.log(`[transactionService - getBudgetTransactions] Fetching transactions for budgetId: ${budgetId}`);
            const response = await axiosInstance.get(`${API_URL}/budget/${budgetId}`);
            return response;
        } catch (error) {
            console.error('[transactionService - getBudgetTransactions] Error fetching budget transactions:', error);
            // If endpoint doesn't exist, return empty array instead of throwing
            if (error?.response?.status === 404) {
                return { data: { transactions: [] } };
            }
            throw error;
        }
    },

    createBudgetTransaction: async (budgetId, transactionData) => {
        try {
            //console.log(`[transactionService - createBudgetTransaction] Creating transaction for budgetId: ${budgetId} with data:`, transactionData);
            const response = await axiosInstance.post(`${API_URL}/budget/${budgetId}`, transactionData);
            //console.log("[transactionService - createBudgetTransaction] Budget transaction created successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("[transactionService - createBudgetTransaction] Error creating budget transaction:", error);
            throw error;
        }
    }
};

export default transactionService;