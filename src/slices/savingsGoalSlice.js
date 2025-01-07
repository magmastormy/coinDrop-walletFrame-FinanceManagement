import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    savingsGoals: [],
    loading: false,
    error: null,
};

const savingsGoalSlice = createSlice({
    name: 'savingsGoal',
    initialState,
    reducers: {
        setSavingsGoals: (state, action) => {
            state.savingsGoals = action.payload;
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

export const { setSavingsGoals, setLoading, setError } = savingsGoalSlice.actions;
export default savingsGoalSlice.reducer;