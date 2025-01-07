import { createSlice } from '@reduxjs/toolkit';

const savingsGoalSlice = createSlice({
    name: 'savingsGoal',
    initialState: {
        goals: [],
        completedGoals: [],
        selectedGoal: null,
        loading: false,
        error: null
    },
    reducers: {
        setSavingsGoals: (state, action) => {
            state.goals = action.payload;
            state.loading = false;
        },
        setCompletedGoals: (state, action) => {
            state.completedGoals = action.payload;
            state.loading = false;
        },
        setSelectedGoal: (state, action) => {
            state.selectedGoal = action.payload;
        },
        addSavingsGoal: (state, action) => {
            state.goals.push(action.payload);
        },
        updateSavingsGoal: (state, action) => {
            const index = state.goals.findIndex(
                (goal) => goal._id === action.payload._id
            );
            if (index !== -1) {
                state.goals[index] = action.payload;
            }
        },
        deleteSavingsGoal: (state, action) => {
            state.goals = state.goals.filter(
                (goal) => goal._id !== action.payload._id
            );
        },
        updateGoalProgress: (state, action) => {
            const { goalId, progress } = action.payload;
            const index = state.goals.findIndex(goal => goal._id === goalId);
            if (index !== -1) {
                state.goals[index].progress = progress;
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearGoals: (state) => {
            state.goals = [];
            state.completedGoals = [];
            state.selectedGoal = null;
            state.error = null;
            state.loading = false;
        }
    }
});

export const {
    setSavingsGoals,
    setCompletedGoals,
    setSelectedGoal,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    updateGoalProgress,
    setLoading,
    setError,
    clearGoals
} = savingsGoalSlice.actions;

export default savingsGoalSlice.reducer;
