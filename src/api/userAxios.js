import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const logError = console.error;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Clerk token getter — set by useClerkAuthSync so the axios instance
// (which lives outside React) can access Clerk's session JWT.
let clerkTokenGetter = async () => null;

export const setClerkTokenGetter = (getter) => {
    clerkTokenGetter = getter;
};

// Request interceptor — attaches the Clerk session token to every request
axiosInstance.interceptors.request.use(
    async (config) => {
        if (config.url === '/auth/login' || config.url === '/auth/register') {
            return config;
        }

        const token = await clerkTokenGetter();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const csrfToken = sessionStorage.getItem('csrfToken');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — Clerk manages auth, so we don't attempt JWT
// refresh or redirect on 401. Just reject and let the caller handle it.
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            logError('Network error:', error.message);
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
