import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    savingsAccounts: [],
    loading: false,
    error: null,
};

const savingsAccountSlice = createSlice({
    name: 'savingsAccount',
    initialState,
    reducers: {
        setSavingsAccounts: (state, action) => {
            state.savingsAccounts = action.payload;
            state.loading = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setSavingsAccounts, setLoading, setError } = savingsAccountSlice.actions;
export default savingsAccountSlice.reducer;