import axiosInstance from "../api/userAxios";

const API_URL ='/profile';

// Function to get user profile
export const getUserProfile = async (userId) => {
    try {
        const response = await axiosInstance.get(`/profile/${userId}`);
        return response.data; // Return the profile data
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch user profile');
    }
};

// Function to update user profile
export const updateUserProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put('/profile', profileData);
        return response.data; // Return the updated profile data
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to update user profile');
    }
};