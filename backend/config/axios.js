const axios = require('axios');

const axiosInstance = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

module.exports = axiosInstance;
