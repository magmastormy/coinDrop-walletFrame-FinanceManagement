import axiosInstance from "../api/userAxios";
const API_URL = '/categories';

export const getUserCategories = async (userId) => {
    try {
        if (!userId) {
            console.error('getUserCategories: User ID is required');
            throw new Error('User ID is required');
        }
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        console.log('[categoryService - getUserCategories]: Successfully fetched categories:', response);
        return response;
    } catch (error) {
        console.error('[categoryService - getUserCategories]: Error fetching categories:', error);
        throw error;
    }
};

const categoryService = {
    createCategory: async (categoryData) => {
        try {
            if (!categoryData ||!categoryData.name) {
                console.error('[categoryService - createCategory]: Category data is required');
                throw new Error('[categoryService - createCategory]: Category data is required');
            }
            const response = await axiosInstance.post(`${API_URL}`, categoryData);
            console.log('[categoryService - createCategory]: Successfully created category:', response.data);
            return response.data;
        } catch (error) {
            console.error('[categoryService - createCategory]:  Error creating category:', error);
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
            console.log('[categoryService - getUserCategories]: Successfully fetched categories:', response);
            return response;
        } catch (error) {
            console.error('[categoryService - getUserCategories]: Error fetching categories:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            if (!id ||!categoryData) {
                console.error('[categoryService - updateCategory]: Category ID and data are required');
                throw new Error('[categoryService - updateCategory] Category ID and data are required');
            }
            const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
            console.log('[categoryService - updateCategory]: Successfully updated category: ', response.data);
            return response.data;
        } catch (error) {
            console.error('[categoryService - updateCategory]: Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            if (!id) {
                throw new Error('[categoryService - delete Category] Category ID is required for deletion');
            }
        
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log('[categoryService - deleteCategory] Category deleted successfully: ', response);
            return response.data;
        } catch (error) {
            console.error('[categoryService - deleteCategory]: Error deleting category: ', error);
            throw error;
        }
    },

    suggestCategory: async (description) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/suggest?description=${description}`);
            console.log('[categoryService - suggestCategory]: AI category suggestion response: ', response)
            return response.data;
        } catch (error) {
            console.error('[categoryService - suggestCategory]: Error fetching AI suggestion:', error);
            throw error;
        }
    }
};

export default categoryService;