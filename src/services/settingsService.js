import axiosInstance from './axiosInstance';

const API_URL = '/settings';

const settingsService = {
    getSettings: async (userId) =>{
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        console.log("User Settings: ", response);
        return response;
    },
    updateNotificationSettings: async (notifications) => {
        const response = await axiosInstance.put('/settings/notifications', notifications);
        return response.data;
    },

    updateSecuritySettings: async (security) => {
        const response = await axiosInstance.put('/settings/security', security);
        return response.data;
    },

    updatePersonalInformation: async (personalInfo) => {
        const response = await axiosInstance.put('/settings/personal', personalInfo);
        return response.data;
    },

    deleteAccount: async () => {
        const response = await axiosInstance.delete('/settings/account');
        return response.data;
    }
};

export default settingsService;