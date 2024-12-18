import axiosInstance from "../api/userAxios";
import { loginSuccess, loginFailure, logout as logoutAction } from '../slices/authSlice';
import store from '../slices/store';

// Simple error messages
const AUTH_ERRORS = {
    INVALID_LOGIN: 'Wrong email or password. Please try again.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
};

// Save user data in browser storage
const storeUserData = (token, user) => {
    console.log('Saving user data...', { user });
    try {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        console.log('✅ User data saved successfully');
    } catch (error) {
        console.error('❌ Failed to save user data:', error);
        throw new Error('Could not save your login information');
    }
};

// Clear user data from storage
const clearUserData = () => {
    console.log('Clearing user data...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

// Update Redux state
const updateAppState = (action) => {
    store.dispatch(action);
};

// Login Function
export const loginUser = async (credentials) => {
    console.log('🔒 Login attempt with:', credentials.email);
    try {
        const response = await axiosInstance.post("/auth/login", credentials);
        console.log('Server response:', response);

        // Check if we have the required data
        if (!response || !response.token || !response.user) {
            console.error('❌ Invalid server response:', response);
            throw new Error('Login failed - invalid server response');
        }

        console.log('✅ Login successful');
        storeUserData(response.token, response.user);
        updateAppState(loginSuccess({ 
            token: response.token, 
            user: response.user 
        }));
        return response;
    } catch (error) {
        console.error('❌ Login error:', error);
        const errorMessage = error.response?.status === 401 
            ? AUTH_ERRORS.INVALID_LOGIN 
            : AUTH_ERRORS.SERVER_ERROR;
        updateAppState(loginFailure(errorMessage));
        throw new Error(errorMessage);
    }
};

// Registration Function
export const registerUser = async (userData) => {
    console.log('📝 Registration attempt:', userData.email);
    try {
        // Basic validation
        const requiredFields = ['email', 'password', 'username', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Remove confirmPassword from data sent to server
        const { confirmPassword, ...registrationData } = userData;
        
        // Send registration request
        const response = await axiosInstance.post("/auth/register", registrationData);
        console.log('✅ Registration successful:', response.data);
        
        // Automatically log in after successful registration
        if (response?.data?.token && response?.data?.user) {
            storeUserData(response.data.token, response.data.user);
            updateAppState(loginSuccess({ 
                token: response.data.token, 
                user: response.data.user 
            }));
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Registration error:', error.response || error);
        throw new Error(error.response?.data?.message || 'Registration failed - please try again');
    }
};

// Logout Function
export const logoutUser = () => {
    console.log('👋 Logging out...');
    clearUserData();
    updateAppState(logoutAction());
    console.log('✅ Logout successful');
};

// Check if user is logged in
export const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;
    console.log('🔑 Auth check:', isLoggedIn ? 'Logged in' : 'Not logged in');
    return isLoggedIn;
};

// Get current user data
export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        console.error('❌ Error getting user data:', error);
        return null;
    }
};