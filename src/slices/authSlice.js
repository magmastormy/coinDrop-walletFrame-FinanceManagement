import {createSlice} from '@reduxjs/toolkit';

const storedToken = sessionStorage.getItem('token');
const storedUser = sessionStorage.getItem('user');
let parsedUser = null;
try {
    parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch (_err) {
    parsedUser = null;
}

const initialState = {
    user: parsedUser,
    loading: false,
    error: null,
    token: storedToken,
    isAuthenticated: Boolean(storedToken && storedUser)
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
            state.token = action.payload.accessToken;
            state.isAuthenticated = true;
            sessionStorage.setItem('token', action.payload.accessToken);
            sessionStorage.setItem('user', JSON.stringify(action.payload.user));
            if (action.payload.refreshToken) {
                sessionStorage.setItem('refreshToken', action.payload.refreshToken);
            }
            if (action.payload.csrfToken) {
                sessionStorage.setItem('csrfToken', action.payload.csrfToken);
            }
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
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('csrfToken');
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            sessionStorage.setItem('user', JSON.stringify(action.payload));

        },
        setToken: (state, action) => {
            state.token = action.payload;
            sessionStorage.setItem('token', action.payload);
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
