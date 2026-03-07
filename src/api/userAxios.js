import axios from 'axios';
import { store } from '../slices/store';
import { logout } from '../slices/authSlice';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Function to refresh the token
const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) throw new Error('No refresh token available');

    const response = await axios.post('http://localhost:5001/api/auth/refresh-token', {
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

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        // Return the data directly for successful responses
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
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
                localStorage.setItem('token', tokenResponse.accessToken);
                if (tokenResponse.refreshToken) {
                    localStorage.setItem('refreshToken', tokenResponse.refreshToken);
                }
                
                // Update headers
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${tokenResponse.accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;

                processQueue(null, tokenResponse.accessToken);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // Clear tokens and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
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
