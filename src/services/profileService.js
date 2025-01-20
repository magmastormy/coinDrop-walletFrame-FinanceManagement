import axiosInstance from "../api/userAxios";

const API_URL = '/profile';


const profileService = {
    getUserProfile: async (userId) => {
        try {
            console.log(`[Profile Service] Fetching profile for user: ${userId}`);
            const response = await axiosInstance.get(`${API_URL}/${userId}`);
            return response;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('[Profile Service] Profile not found, creating new profile...');
                const newProfileData = {
                    bio: '',
                    interests: [],
                    phone: ''
                };
                const createResponse = await profileService.createUserProfile(userId, newProfileData);
                console.log('[Profile Service] New profile created:', createResponse);
                return createResponse.data;
            }
            throw new Error(error.response?.data?.error || 'Failed to fetch profile');
        }
    },

    updateUserProfile: async (userId, profileData) => {
        try {
            console.log(`[Profile Service] Updating profile for user:`, userId, profileData);
            
            // Get current profile to compare changes
            const currentProfile = await profileService.getUserProfile(userId);
            
            // Only include fields that have changed
            const updates = {};
            Object.keys(profileData).forEach(key => {
                if (profileData[key] !== currentProfile?.profile?.[key]) {
                    updates[key] = profileData[key];
                }
            });
    
            if (Object.keys(updates).length === 0) {
                console.log('[Profile Service] No changes detected');
                return currentProfile;
            }
    
            const response = await axiosInstance.put(`${API_URL}/`, updates);
            console.log(`[Profile Service] Profile update successful:`, response);
            return response;
        } catch (error) {
            console.error('[Profile Service] Error updating profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to update profile');
        }
    },

    createUserProfile: async (userId, profileData) => {
        try {
            console.log(`Creating profile for user: ${userId}`);
            const response = await axiosInstance.post(`${API_URL}/${userId}`, profileData);
            console.log(`[Profile Service] Profile creation successful:`, response);
            return response;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to create profile');
        }
    },

    uploadProfileImage: async (file, type = 'profile') => {
        try {
            console.log('[Profile Service: uploadProfileImage] Sending image to upload:', file);
            const formData = new FormData();
            formData.append('image', file);
    
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
    
            const response = await axiosInstance.post(
                `${API_URL}/upload-image?type=${type}`,
                formData,
                config
            );
            console.log('[Profile Service: uploadProfileImage] Upload response:', response);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || '[Profile Service: uploadProfileImage] Failed to upload image');
        }
    },

    getUserFollowers: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${userId}/followers`);
            return response.data;
        } catch (error) {
            console.error('Error fetching followers:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch followers');
        }
    },

    getUserFollowing: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${userId}/following`);
            return response.data;
        } catch (error) {
            console.error('Error fetching following:', error);
            throw new Error(error.response?.data?.error || 'Failed to fetch following');
        }
    },

    deleteUserProfile: async (userId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting profile:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete profile');
        }
    },

    deleteProfileImage: async (type = 'profile') => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/image?type=${type}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default profileService;