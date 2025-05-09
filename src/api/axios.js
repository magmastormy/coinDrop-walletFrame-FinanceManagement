import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:5000/api' || baseURL || import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
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

// Request interceptor - Add auth token
instance.interceptors.request.use(
    (config) => {
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

// Response interceptor - Extract data
instance.interceptors.response.use(
    (response) => {
        //console.log('Axios - Raw Axios Response:', response);
        //console.log('Axios - Axios Response Data:', response.data);
        return response.data;
    },
    (error) => {
        console.error('Axios - Axios Error:', error);
        return Promise.reject(error);
    }
);

export default instance;