import { useLogger } from '../hooks/useLogger.jsx';

import axiosInstance from '../api/userAxios';
const API_URL = '/categories';

export const getUserCategories = async () => {
    try {
        const response = await axiosInstance.get(API_URL);
        return Array.isArray(response) ? response : [];
    } catch (error) {
        logError('Failed to fetch categories:', error);
        return [];
    }
};

const categoryService = {
    createCategory: async categoryData => {
        // Input validation
        if (!categoryData || typeof categoryData !== 'object') {
            throw new Error('Category data must be a valid object');
        }
        
        if (!categoryData.name || typeof categoryData.name !== 'string' || categoryData.name.trim().length === 0) {
            throw new Error('Category name is required and must be a non-empty string');
        }

        try {
            const response = await axiosInstance.post(API_URL, categoryData);
            return response.category || response;
        } catch (error) {
            logError('Create category failed:', error);
            throw error;
        }
    },

    getUserCategories,

    updateCategory: async (id, categoryData) => {
        // Input validation
        if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
            throw new Error('Valid category ID is required');
        }
        
        if (!categoryData || typeof categoryData !== 'object') {
            throw new Error('Category data must be a valid object');
        }

        try {
            const response = await axiosInstance.put(`${API_URL}/${id}`, categoryData);
            return response.category || response;
        } catch (error) {
            logError('Update category failed:', error);
            throw error;
        }
    },

    deleteCategory: async id => {
        // Input validation
        if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
            throw new Error('Valid category ID is required');
        }

        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            return response;
        } catch (error) {
            logError('Delete category failed:', error);
            throw error;
        }
    },

    suggestCategory: async description => {
        // Input validation
        if (!description || typeof description !== 'string') {
            throw new Error('Description is required and must be a string');
        }

        try {
            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Category suggestion request timed out')), 15000)
            );

            const response = await Promise.race([
                axiosInstance.get(`${API_URL}/suggest?description=${encodeURIComponent(description)}`),
                timeoutPromise
            ]);
            
            return response;
        } catch (error) {
            logError('Category suggestion failed:', error);
            throw error;
        }
    }
};

export default categoryService;
