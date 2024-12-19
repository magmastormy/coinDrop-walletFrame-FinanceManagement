import axiosInstance from "../api/userAxios";

const API_URL = '/settings';

const settingsService = {
    // Settings-specific operations
    getUserSettings: async (userId) => {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        console.log("Settings response.data: ",response.data);
        console.log("Settings response:", response);
        return response.data;
    },

    updateNotificationSettings: async (notifications) => {
        const response = await axiosInstance.put(`${API_URL}/notifications`, notifications);
        return response.data;
    },

    updatePreferences: async (preferences) => {
        const response = await axiosInstance.put(`${API_URL}/preferences`, preferences);
        return response.data;
    },

    updateSecuritySettings: async (security) => {
        const response = await axiosInstance.put(`${API_URL}/security`, security);
        return response.data;
    },

    verifyTransactionPin: async (pin) => {
        const response = await axiosInstance.post(`${API_URL}/verify-pin`, { pin });
        return response.data;
    },

    // Profile-related operations
    getProfile: async () => {
        const response = await axiosInstance.get(`${API_URL}/profile`);
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await axiosInstance.put(`${API_URL}/profile`, profileData);
        return response.data;
    },

    deleteAccount: async () => {
        const response = await axiosInstance.delete(`${API_URL}/account`);
        return response.data;
    }
};

export default settingsService;
