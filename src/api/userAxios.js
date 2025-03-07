import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Function to check if the token is expired
const isTokenExpired = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (!payload.exp) return true;
        return payload.exp * 1000 < Date.now();
    } catch (error) {
        console.error('Token validation error:', error);
        return true;
    }
};

// Function to refresh the token
const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axiosInstance.post('/auth/refresh-token', { refreshToken });
    return response.token; // Match backend response structure
};

let isRefreshing = false;

// Add request interceptor to handle auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        // Skip token refresh for refresh and login endpoints
        if (config.url === '/auth/refresh-token' || config.url === '/auth/login' || config.url === '/auth/register') {
            console.log('Skipping token check for:', config.url);
            return config;
        }
        const token = localStorage.getItem('token');

        if (!token) {
            return config;
        }

        if (isTokenExpired(token)) {
            try {
                const newToken = await refreshToken();
                localStorage.setItem('token', newToken);
                config.headers.Authorization = `Bearer ${newToken}`;
            } catch (error) {
                console.error('Token refresh failed:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
//If the refresh fails (e.g., due to an invalid token), redirect the user to log in
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            try {
                const newAccessToken = await refreshToken();
                error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosInstance(error.config);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Add response interceptor to extract data
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('User axios - Response Data:', response.data);
        // Return the data directly
        return response.data;
    },
    async (error) => {
        console.error('User-axios - Axios error:', error);
        const originalRequest = error.config;
        
        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) return Promise.reject(error);
            
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshToken();
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                window.location.href = '/login'; // Immediate redirect on failure
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
