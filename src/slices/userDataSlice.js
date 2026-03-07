import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
    name: 'data',
    initialState: {
        budgets: [],
        transactions: [],
        loading: false,
        error: null,
    },
    reducers: {
        setBudgets(state, action) {
            state.budgets = action.payload;
        },
        setTransactions(state, action) {
            state.transactions = action.payload;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        },
    },
});

export const { setBudgets, setTransactions, setLoading, setError } = dataSlice.actions;
export default dataSlice.reducer;
