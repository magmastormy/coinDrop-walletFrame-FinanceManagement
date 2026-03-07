import axiosInstance from '../api/userAxios';

const API_URL = '/settings';

const settingsService = {
    getUserSettings: async () => {
        const response = await axiosInstance.get(API_URL);
        return response;
    },

    updateNotificationSettings: async notifications => {
        const response = await axiosInstance.put(`${API_URL}/notifications`, notifications);
        return response;
    },

    updatePreferences: async preferences => {
        const response = await axiosInstance.put(`${API_URL}/preferences`, preferences);
        return response;
    },

    updateSecuritySettings: async security => {
        const response = await axiosInstance.put(`${API_URL}/security`, security);
        return response;
    },

    verifyTransactionPin: async pin => {
        const response = await axiosInstance.post(`${API_URL}/verify-pin`, { pin });
        return response;
    },

    getProfile: async () => {
        const response = await axiosInstance.get(`${API_URL}/profile`);
        return response;
    },

    updateProfile: async profileData => {
        const response = await axiosInstance.put(`${API_URL}/profile`, profileData);
        return response;
    },

    deleteAccount: async () => {
        const response = await axiosInstance.delete(`${API_URL}/account`);
        return response;
    }
};

export default settingsService;
