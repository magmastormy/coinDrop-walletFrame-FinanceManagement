import { createSlice } from '@reduxjs/toolkit';

const savingsAccountSlice = createSlice({
    name: 'savingsAccount',
    initialState: {
        account: null,
        transactions: [],
        automaticSettings: null,
        loading: false,
        error: null
    },
    reducers: {
        setSavingsAccount: (state, action) => {
            state.account = action.payload;
            state.loading = false;
        },
        setSavingsTransactions: (state, action) => {
            state.transactions = action.payload;
            state.loading = false;
        },
        setAutomaticSettings: (state, action) => {
            state.automaticSettings = action.payload;
            state.loading = false;
        },
        addSavingsTransaction: (state, action) => {
            state.transactions.push(action.payload);
        },
        updateSavingsTransaction: (state, action) => {
            const index = state.transactions.findIndex(
                (transaction) => transaction._id === action.payload._id
            );
            if (index !== -1) {
                state.transactions[index] = action.payload;
            }
        },
        deleteSavingsTransaction: (state, action) => {
            state.transactions = state.transactions.filter(
                (transaction) => transaction._id !== action.payload._id
            );
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearSavingsAccount: (state) => {
            state.account = null;
            state.transactions = [];
            state.automaticSettings = null;
            state.error = null;
            state.loading = false;
        }
    }
});

export const {
    setSavingsAccount,
    setSavingsTransactions,
    setAutomaticSettings,
    addSavingsTransaction,
    updateSavingsTransaction,
    deleteSavingsTransaction,
    setLoading,
    setError,
    clearSavingsAccount
} = savingsAccountSlice.actions;

export default savingsAccountSlice.reducer;
