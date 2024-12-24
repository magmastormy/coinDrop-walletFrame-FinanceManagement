import axiosInstance from "../api/userAxios";
const API_URL = '/categories';

const categoryService = {
    createCategory: async (categoryData) => {
        const response = await axiosInstance.post(`${API_URL}`, categoryData);
        return response.data;
    },

    getAllCategories: async () => {
        const response = await axiosInstance.get(`${API_URL}`);
        return response.data;
    },

    updateCategory: async (id, categoryData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
        return response.data;
    },

    deleteCategory: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    }
};

export default categoryService;