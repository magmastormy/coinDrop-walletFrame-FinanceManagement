import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    transactions: [],
    loading: false,
    error: null,
    selectedTransaction: null,
};

const transactionSlice = createSlice({
    name: 'transaction',
    initialState,
    reducers: {
        setTransactions: (state, action) => {
            state.transactions = action.payload;
            state.loading = false
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        setSelectedTransaction: (state, action) => {
            state.selectedTransaction = action.payload;
        },
        addTransaction: (state, action) => {
            state.transactions.push(action.payload);
        },
        updateTransaction: (state, action) => {
            const index = state.transactions.findIndex((transaction) => transaction._id === action.payload._id);
            if (index !== -1) {
                state.transactions[index] = action.payload;
            }
        },
        deleteTransaction: (state, action) => {
            state.transactions = state.transactions.filter((transaction) => transaction._id !== action.payload._id);
        },
    },
});

export const {
    setTransactions,
    setLoading,
    setError,
    setSelectedTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
} = transactionSlice.actions;

// Memoized Selectors
export const selectAllTransactions = (state) => state.transaction.transactions;
export const selectTransactionLoading = (state) => state.transaction.loading;
export const selectTransactionError = (state) => state.transaction.error;
export const selectSelectedTransaction = (state) => state.transaction.selectedTransaction;

// Derived selectors
export const selectRecentTransactions = (state, limit = 10) =>
    state.transaction.transactions.slice(0, limit);

export const selectTransactionsByCategory = (state, categoryId) =>
    state.transaction.transactions.filter(tx => tx.categoryId === categoryId);

export const selectTransactionById = (state, transactionId) =>
    state.transaction.transactions.find(tx => tx._id === transactionId);

export default transactionSlice.reducer;
