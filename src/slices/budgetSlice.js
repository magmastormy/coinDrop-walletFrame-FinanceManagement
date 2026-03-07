import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    budgets: [],
    loading: false,
    error: null,
    selectedBudget: null,
};

const budgetSlice = createSlice({
    name: 'budget',
    initialState,
    reducers: {
        setBudgets: (state, action) => {
            state.budgets = action.payload;
            state.loading = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        setSelectedBudget: (state, action) => {
            state.selectedBudget = action.payload;
        },
        addBudget: (state, action) => {
            state.budgets.push(action.payload);
        },
        updateBudget: (state, action) => {
            const index = state.budgets.findIndex(b => b._id === action.payload._id);
            if (index !== -1) {
                state.budgets[index] = action.payload;
            }
        },
        deleteBudget: (state, action) => {
            state.budgets = state.budgets.filter(b => b._id !== action.payload);
        },
    }
});

export const {
    setBudgets,
    setLoading,
    setError,
    setSelectedBudget,
    addBudget,
    updateBudget,
    deleteBudget,
} = budgetSlice.actions;

// Memoized Selectors
export const selectAllBudgets = (state) => state.budget.budgets;
export const selectBudgetLoading = (state) => state.budget.loading;
export const selectBudgetError = (state) => state.budget.error;
export const selectSelectedBudget = (state) => state.budget.selectedBudget;

// Derived selectors
export const selectActiveBudgets = (state) =>
    state.budget.budgets.filter(budget => budget.isActive !== false);

export const selectTotalBudgetAmount = (state) =>
    state.budget.budgets.reduce((total, budget) => total + (budget.amount || 0), 0);

export const selectBudgetById = (state, budgetId) =>
    state.budget.budgets.find(budget => budget._id === budgetId);

export default budgetSlice.reducer;
