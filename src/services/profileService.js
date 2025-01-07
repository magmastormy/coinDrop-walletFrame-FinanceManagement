import axiosInstance from "../api/userAxios";

const API_URL = '/profile';

/**
 * Service for handling user profile operations
 */
const profileService = {
    /**
     * Get user profile by ID
     * @param {string} userId - The user's ID
     */
    getUserProfile: async (userId) => {
        try {
            console.log(`Fetching profile for user: ${userId}`);
            const response = await axiosInstance.get(`${API_URL}/${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch profile');
        }
    },

    /**
     * Update user profile
     * @param {string} userId - The user's ID
     * @param {Object} profileData - Profile data to update
     */
    updateUserProfile: async (userId, profileData) => {
        try {
            console.log(`Updating profile for user: ${userId}`);
            const response = await axiosInstance.put(`${API_URL}/${userId}`, profileData);
            console.log(`[Profile Service] Profile update successful:`, response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to update profile');
        }
    },

    /**
     * Create new user profile
     * @param {string} userId - The user's ID
     * @param {Object} profileData - Initial profile data
     */
    createUserProfile: async (userId, profileData) => {
        try {
            console.log(`Creating profile for user: ${userId}`);
            const response = await axiosInstance.post(`${API_URL}/${userId}`, profileData);
            console.log(`[Profile Service] Profile creation successful:`, response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to create profile');
        }
    },

    /**
     * Get user's followers
     * @param {string} userId - The user's ID
     */
    getUserFollowers: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${userId}/followers`);
            return response.data;
        } catch (error) {
            console.error('Error fetching followers:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch followers');
        }
    },

    /**
     * Get users being followed
     * @param {string} userId - The user's ID
     */
    getUserFollowing: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${userId}/following`);
            return response.data;
        } catch (error) {
            console.error('Error fetching following:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch following');
        }
    },

    /**
     * Delete user profile
     * @param {string} userId - The user's ID
     */
    deleteUserProfile: async (userId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete profile');
        }
    }
};

export default profileService;