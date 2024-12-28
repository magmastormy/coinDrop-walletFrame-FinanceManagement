import axiosInstance from "../api/userAxios";
import { loginSuccess, loginFailure, logout as logoutAction } from '../slices/authSlice';
import store from '../slices/store';
import walletService from './walletService';
import budgetService from './budgetService';
import categoryService from './categoryService';
import transactionService from './transactionService';
import { setWallets } from '../slices/walletSlice';
import { setBudgets } from '../slices/budgetSlice';
import { setCategories } from '../slices/categorySlice';
import { setTransactions } from '../slices/transactionSlice';

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


const clearUserData = () => {
    console.log('Clearing user data...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};


const updateAppState = (action) => {
    store.dispatch(action);
};


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
        const userId = response.user.id || response.user._id || response.user.userId || response.user._userId;
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
        updateAppState(setTransactions(userTransactions || []));

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
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const { confirmPassword, ...registrationData } = userData;
        
        const response = await axiosInstance.post("/auth/register", registrationData);
        console.log('✅ Registration successful:', response.data);
        
        //idea, because of lack of categories, lets enforce a "default" category for all useers,
        //at least for transactions to start and other stuff.
        //this is a temporary solution, we will remove it later
        try {
            await categoryService.createCategory({
                name: "Default",
                userId: response.user.id,
                description: "Default category for uncategorized items"
            });
            console.log('✅ Default category created for new user');
        } catch (categoryError) {
            console.error('❌ Error creating default category:', categoryError);
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
        throw new Error(error.response?.data?.message || 'Registration failed - please try again');
    }
};

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