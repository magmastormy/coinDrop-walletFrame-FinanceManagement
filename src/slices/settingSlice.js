import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
    name: 'setting',
    initialState: {
        settings: [],
        loading: false,
        error: null
    },
    reducers: {
        setSettings: (state, action) => {
            state.settings = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearSettings: (state) => {
            state.settings = null;
            state.loading = false;
            state.error = null;
        }
    }
});

export const { 
    setSettings, 
    setLoading, 
    setError, 
    clearSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
