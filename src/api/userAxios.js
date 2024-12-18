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
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000; // Current time in seconds
    return payload.exp < currentTime; // Check if the token is expired
};

// Function to refresh the token
const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken'); // Assuming you store refresh token
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post('/auth/refresh-token', { refreshToken });
    return response.data.token; // Assuming the new token is returned in this format
};



// Add request interceptor to handle auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');

        if (isTokenExpired(token)) {
            try {
                const newToken = await refreshToken();
                localStorage.setItem('token', newToken); // Store the new token
                config.headers.Authorization = `Bearer ${newToken}`; // Set the new token in the request
            } catch (error) {
                console.error('Token refresh failed:', error);
                // Handle token refresh failure (e.g., redirect to login)
            }
        } else {
            config.headers.Authorization = `Bearer ${token}`; // Set the existing token
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to extract data
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('User-axios - Raw response:', response);
        console.log('User axios - Response Data:', response.data);
        // Return the data directly
        return response.data;
    },
    (error) => {
        console.error('User-axios - Axios error:', error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
