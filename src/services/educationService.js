import axiosInstance from "../api/userAxios";
const API_URL = '/education';

const educationService = {

    getEducations: async () => {
        const response = await axiosInstance.get(API_URL);
        return response;
    },

    createEducation: async (educationData) => {
        const response = await axiosInstance.post(API_URL, educationData);
        return response.data;
    },

    updateEducation: async (id, educationData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, educationData);
        return response.data;
    },

    getUserEducations: async (userId) => {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        return response;
    },

    deleteEducation: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },
};

export default educationService;