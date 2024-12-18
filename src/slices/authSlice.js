import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    user: null,
    loading: false,
    error: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload.token);
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;

        },
        setToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('token', action.payload);
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

export const {
    loginStart, 
    loginSuccess, 
    loginFailure, 
    logout, 
    setUser, 
    setToken, 
    setError, 
    setLoading, 
    clearError} = authSlice.actions;
    
export default authSlice.reducer;