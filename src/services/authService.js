import axiosInstance from '../api/userAxios';
import { loginSuccess, logout as logoutAction } from '../slices/authSlice';
import store from '../slices/store';

export const AUTH_ERRORS = {
    INVALID_LOGIN: 'Wrong email or password. Please try again.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    DUPLICATE_EMAIL: 'This email is already registered.',
    DUPLICATE_USERNAME: 'This username is already taken.',
    PASSWORD_REQUIREMENTS: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
    MISSING_FIELDS: 'Please fill in all required fields.',
    PASSWORD_MISMATCH: 'Passwords do not match'
};

const storeUserData = (accessToken, refreshToken, userData, csrfToken) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
    if (csrfToken) {
        localStorage.setItem('csrfToken', csrfToken);
    }

    store.dispatch(loginSuccess({
        user: userData,
        accessToken,
        refreshToken,
        csrfToken
    }));
};

const clearUserData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
};

// Rate limiting to prevent rapid login attempts
let lastLoginAttempt = 0;
const LOGIN_COOLDOWN = 3000; // 3 seconds between attempts

const formatErrorMessage = error => {
    if (!error.response) {
        return AUTH_ERRORS.NETWORK_ERROR;
    }

    const { status, data } = error.response;

    if (status === 429) {
        // Rate limit exceeded - provide helpful message
        return data?.message || 'Too many attempts. Please wait a moment and try again.';
    }

    if (status === 400) {
        if (Array.isArray(data?.details)) {
            return { error: AUTH_ERRORS.VALIDATION_ERROR, details: data.details };
        }
        if ((data?.details || data?.message || '').toLowerCase().includes('email')) {
            return AUTH_ERRORS.DUPLICATE_EMAIL;
        }
        if ((data?.details || data?.message || '').toLowerCase().includes('username')) {
            return AUTH_ERRORS.DUPLICATE_USERNAME;
        }
        return data?.details || data?.message || AUTH_ERRORS.VALIDATION_ERROR;
    }

    if (status === 401) {
        return AUTH_ERRORS.INVALID_LOGIN;
    }

    return data?.details || data?.message || AUTH_ERRORS.SERVER_ERROR;
};

export const loginUser = async credentials => {
    try {
        // Check rate limiting
        const now = Date.now();
        const timeSinceLastAttempt = now - lastLoginAttempt;
        
        if (timeSinceLastAttempt < LOGIN_COOLDOWN) {
            const remainingTime = Math.ceil((LOGIN_COOLDOWN - timeSinceLastAttempt) / 1000);
            throw new Error(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before trying again.`);
        }
        
        lastLoginAttempt = now;
        
        const response = await axiosInstance.post('/auth/login', credentials);
        if (!response?.data?.accessToken || !response?.data?.user) {
            throw new Error('Authentication failed');
        }

        storeUserData(response.data.accessToken, response.data.refreshToken, response.data.user, response.data.csrfToken);
        return response.data;
    } catch (error) {
        throw formatErrorMessage(error);
    }
};

export const registerUser = async userData => {
    try {
        const requiredFields = ['email', 'password', 'username', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        if (missingFields.length > 0) {
            throw new Error(AUTH_ERRORS.MISSING_FIELDS);
        }

        const { confirmPassword, ...registrationData } = userData;
        const response = await axiosInstance.post('/auth/register', registrationData);

        if (response?.data?.accessToken && response?.data?.user) {
            storeUserData(response.data.accessToken, response.data.refreshToken, response.data.user, response.data.csrfToken);
        }

        return response.data;
    } catch (error) {
        throw formatErrorMessage(error);
    }
};

export const logoutUser = () => {
    clearUserData();
    store.dispatch(logoutAction());
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return Boolean(token && user);
};

export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (_error) {
        return null;
    }
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await axiosInstance.post('/auth/change-password', {
            currentPassword,
            newPassword
        });

        return response;
    } catch (error) {
        throw new Error(error.response?.data?.details || 'Failed to change password.');
    }
};

export const logout = () => {
    logoutUser();
    window.location.href = '/login';
};

export const forgotPassword = async userData => {
    const response = await axiosInstance.post('/auth/reset-password', userData);
    return response;
};

const authService = {
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    changePassword,
    isAuthenticated,
    getStoredUser,
    logout
};

export default authService;
