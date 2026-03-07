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

const storeUserData = (accessToken, refreshToken, userData) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }

    store.dispatch(loginSuccess({
        user: userData,
        accessToken,
        refreshToken
    }));
};

const clearUserData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

const formatErrorMessage = error => {
    if (!error.response) {
        return AUTH_ERRORS.NETWORK_ERROR;
    }

    const { status, data } = error.response;

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
        const response = await axiosInstance.post('/auth/login', credentials);
        if (!response?.accessToken || !response?.user) {
            throw new Error('Authentication failed');
        }

        storeUserData(response.accessToken, response.refreshToken, response.user);
        return response;
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

        if (response?.accessToken && response?.user) {
            storeUserData(response.accessToken, response.refreshToken, response.user);
        }

        return response;
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
