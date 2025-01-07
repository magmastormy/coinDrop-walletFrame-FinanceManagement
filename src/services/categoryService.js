// src/services/categoryService.js
import axiosInstance from "../api/userAxios";
const API_URL = '/categories';

// Export individual functions for better tree-shaking
export const getUserCategories = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

const categoryService = {
    createCategory: async (categoryData) => {
        try {
            if (!categoryData || !categoryData.name) {
                throw new Error('Category data is required');
            }
            const response = await axiosInstance.post(`${API_URL}`, categoryData);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    getUserCategories: async (userId) => {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            if (!id || !categoryData) {
                throw new Error('Category ID and data are required');
            }
            const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            // First fetch the category to check if it's the default "None" category
            const category = await axiosInstance.get(`${API_URL}/${id}`);
            if (category.data.name === "None") {
                throw new Error("Cannot delete the default 'None' category");
            }
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};

export default categoryService;