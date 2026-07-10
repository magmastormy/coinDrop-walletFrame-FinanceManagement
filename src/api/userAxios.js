import axios from 'axios';
import { store } from '../slices/store';
import { logout } from '../slices/authSlice';

const API_BASE_URL = process.env.VITE_API_BASE_URL || '/api';
const logError = console.error;

// Create axios instance with timeout configuration
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Function to refresh the token
const refreshToken = async () => {
    const storedRefreshToken = sessionStorage.getItem('refreshToken');
    if (!storedRefreshToken) throw new Error('No refresh token available');

    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken: storedRefreshToken
    });
    return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
    };
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add request interceptor to handle auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        // Skip token refresh for auth endpoints
        if (config.url === '/auth/refresh-token' || config.url === '/auth/login' || config.url === '/auth/register') {
            return config;
        }

        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for non-auth requests
        const csrfToken = sessionStorage.getItem('csrfToken');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add single consolidated response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Return the full response object to maintain consistency
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
            logError('Network error:', error.message);
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Handle 401 errors with token refresh (only once per request)
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const tokenResponse = await refreshToken();
                sessionStorage.setItem('token', tokenResponse.accessToken);
                if (tokenResponse.refreshToken) {
                    sessionStorage.setItem('refreshToken', tokenResponse.refreshToken);
                }
                if (tokenResponse.csrfToken) {
                    sessionStorage.setItem('csrfToken', tokenResponse.csrfToken);
                }
                
                // Update headers
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${tokenResponse.accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
                
                // Update CSRF token header if available
                if (tokenResponse.csrfToken) {
                    originalRequest.headers['X-CSRF-Token'] = tokenResponse.csrfToken;
                }

                processQueue(null, tokenResponse.accessToken);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // Clear tokens and redirect to login
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('csrfToken');
                store.dispatch(logout());
                window.location.href = '/login';
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For other errors, just reject
        return Promise.reject(error);
    }
);

export default axiosInstance;
