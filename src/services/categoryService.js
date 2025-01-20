// src/services/categoryService.js
import axiosInstance from "../api/userAxios";
const API_URL = '/categories';

// Export individual functions for better tree-shaking
export const getUserCategories = async (userId) => {
    try {
        if (!userId) {
            console.error('getUserCategories: User ID is required');
            throw new Error('User ID is required');
        }
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        console.log('getUserCategories: Successfully fetched categories:', response);
        return response;
    } catch (error) {
        console.error('getUserCategories: Error fetching categories:', error);
        throw error;
    }
};

const categoryService = {
    createCategory: async (categoryData) => {
        try {
            if (!categoryData ||!categoryData.name) {
                console.error('createCategory: Category data is required');
                throw new Error('Category data is required');
            }
            const response = await axiosInstance.post(`${API_URL}`, categoryData);
            console.log('createCategory: Successfully created category:', response.data);
            return response.data;
        } catch (error) {
            console.error('createCategory: Error creating category:', error);
            throw error;
        }
    },

    getUserCategories: async (userId) => {
        try {
            if (!userId) {
                console.error('categoryService.getUserCategories: User ID is required');
                throw new Error('User ID is required');
            }
            const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
            console.log('categoryService.getUserCategories: Successfully fetched categories:', response);
            return response;
        } catch (error) {
            console.error('categoryService.getUserCategories: Error fetching categories:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            if (!id ||!categoryData) {
                console.error('updateCategory: Category ID and data are required');
                throw new Error('Category ID and data are required');
            }
            const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
            console.log('updateCategory: Successfully updated category:', response.data);
            return response.data;
        } catch (error) {
            console.error('updateCategory: Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            // First fetch the category to check if it's the default "None" category
            const category = await axiosInstance.get(`${API_URL}/${id}`);
            if (category.data.name === "None") {
                console.error('deleteCategory: Cannot delete the default "None" category');
                throw new Error("Cannot delete the default 'None' category");
            }
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log('deleteCategory: Successfully deleted category:', response.data);
            return response.data;
        } catch (error) {
            console.error('deleteCategory: Error deleting category:', error);
            throw error;
        }
    }
};

export default categoryService;