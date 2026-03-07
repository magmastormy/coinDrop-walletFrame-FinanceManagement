import axiosInstance from '../api/userAxios';
const API_URL = '/categories';

export const getUserCategories = async () => {
    const response = await axiosInstance.get(API_URL);
    return Array.isArray(response) ? response : [];
};

const categoryService = {
    createCategory: async categoryData => {
        const response = await axiosInstance.post(API_URL, categoryData);
        return response.category || response;
    },

    getUserCategories,

    updateCategory: async (id, categoryData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
        return response.category || response;
    },

    deleteCategory: async id => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response;
    },

    suggestCategory: async description => {
        const response = await axiosInstance.get(`${API_URL}/suggest?description=${encodeURIComponent(description)}`);
        return response;
    }
};

export default categoryService;
