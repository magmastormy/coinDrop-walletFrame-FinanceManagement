import axiosInstance from "../api/userAxios";
import { loginSuccess, loginFailure, logout as logoutAction } from '../slices/authSlice';
import store from '../slices/store';
import walletService from './walletService';
import budgetService from './budgetService';
import categoryService from './categoryService';
import transactionService from './transactionService';
import savingsAccountService from './savingsAccountService'; // Added import statement
import { setWallets } from '../slices/walletSlice';
import { setBudgets } from '../slices/budgetSlice';
import { setCategories } from '../slices/categorySlice';
import { setTransactions } from '../slices/transactionSlice';

// Simple error messages
const AUTH_ERRORS = {
    INVALID_LOGIN: 'Wrong email or password. Please try again.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    DUPLICATE_EMAIL: 'This email is already registered.',
    DUPLICATE_USERNAME: 'This username is already taken.',
    PASSWORD_REQUIREMENTS: 'Password must include uppercase, lowercase, number, and special character.',
    MISSING_FIELDS: 'Please fill in all required fields.',
};

// Helper function to format error messages
const formatErrorMessage = (error) => {
    if (!error.response) {
        return AUTH_ERRORS.NETWORK_ERROR;
    }

    const { status, data } = error.response;

    if (status === 400) {
        if (data.details) {
            return {
                error: AUTH_ERRORS.VALIDATION_ERROR,
                details: data.details
            };
        }
        if (data.message?.includes('email')) {
            return AUTH_ERRORS.DUPLICATE_EMAIL;
        }
        if (data.message?.includes('username')) {
            return AUTH_ERRORS.DUPLICATE_USERNAME;
        }
        if (data.message?.includes('password')) {
            return AUTH_ERRORS.PASSWORD_REQUIREMENTS;
        }
        return data.message || AUTH_ERRORS.VALIDATION_ERROR;
    }

    if (status === 401) {
        return AUTH_ERRORS.INVALID_LOGIN;
    }

    return AUTH_ERRORS.SERVER_ERROR;
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

// Clear user data from browser storage
const clearUserData = () => {
    console.log('Clearing user data...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

// Update app state with a given action
const updateAppState = (action) => {
    store.dispatch(action);
};

// Login function
export const loginUser = async (credentials) => {
    console.log('🔒 Login attempt with:', credentials.email);
    try {
        const response = await axiosInstance.post("/auth/login", credentials);
        console.log('Server response:', response);

        if (!response || !response.token || !response.user) {
            console.error('❌ Invalid server response:', response);
            throw new Error('Login failed - invalid server response');
        }

        console.log('✅ Login successful');

        //now i want to fetch the users data from the database to sort this bug where components have missing data
        //lets get everything wallets, budgets, categories
        //i think transactions are not necessary for now, maybe for the dashboard but not yet.
        /*const userId = response.user.id || response.user._id || response.user.userId || response.user._userId;
        console.log("Login userId:", userId);

        const userWallets = await walletService.getAllWallets(userId);
        console.log('userWallets:', userWallets);

        const userBudgets = await budgetService.getUserBudgets(userId);
        console.log('userBudgets:', userBudgets);

        const userCategories = await categoryService.getUserCategories(userId);
        console.log('userCategories:', userCategories);

        const userTransactions = await transactionService.getUserTransactions(userId);
        console.log('userTransactions:', userTransactions);

        updateAppState(setWallets(userWallets || []));
        updateAppState(setBudgets(userBudgets || []));
        updateAppState(setCategories(userCategories || []));
        updateAppState(setTransactions(userTransactions || [])); */

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
        const requiredFields = ['email', 'password', 'username', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(AUTH_ERRORS.MISSING_FIELDS);
        }

        const { confirmPassword, ...registrationData } = userData;
        
        const response = await axiosInstance.post("/auth/register", registrationData);
        console.log('✅ Registration successful:', response.data);
        
        const userId = response.data.user.id;

        // Create default "None" category
        try {
            await categoryService.createCategory({
                name: "None",
                userId: userId,
                description: "Default category for uncategorized items"
            });
            console.log('✅ Default "None" category created for new user');
        } catch (categoryError) {
            console.error('❌ Error creating default category:', categoryError);
        }

        // Create default savings account
        try {
            await savingsAccountService.createSavingsAccount({
                userId: userId,
                name: "Savings",
                balance: 0,
                description: "Default savings account"
            });
            console.log('✅ Default savings account created for new user');
        } catch (savingsError) {
            console.error('❌ Error creating default savings account:', savingsError);
        }
     
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
        const formattedError = formatErrorMessage(error);
        throw formattedError;
    }
};

// Logout function
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

// Change password function
export const changePassword = async(oldPassword, newPassword) => {
    try {
        const response = await axiosInstance.put('/auth/change-password', {
            oldPassword,
            newPassword
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to change password.');
    }
};