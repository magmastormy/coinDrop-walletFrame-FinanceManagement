import axiosInstance from "../api/userAxios";
import ImageService from "../services/imageService";

const API_URL = '/profile';


const profileService = {
    getUserProfile: async (userId) => {
        try {
            console.log(`[Profile Service] Fetching profile for user: ${userId}`);
            const response = await axiosInstance.get(`${API_URL}/${userId}`);
            console.log('[Profile Service] Profile fetched successfully:', response);
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

    uploadProfileImage: async (userId, file) => {
        try {
            if (!file || !userId) {
                throw new Error('File and user ID are required');
            }
            
            // More robust file validation that doesn't rely solely on instanceof
            if (!file.name || !file.type || !file.type.startsWith('image/')) {
                throw new Error('Invalid file format - must be an image file');
            }
            
            console.log("[ProfileService] Uploading profile image for user:", userId);
            console.log("[ProfileService] File details:", { 
                name: file.name, 
                type: file.type, 
                size: file.size 
            });
            
            // Use ImageService to handle the actual upload
            const imageResponse = await ImageService.uploadImage(file, 'profile');
            console.log("[ProfileService] Image upload response:", imageResponse);
            
            // Check if we have the required data
            if (!imageResponse || (!imageResponse.url && !imageResponse.secure_url)) {
                console.error("[ProfileService] Invalid image response:", imageResponse);
                throw new Error('Failed to upload image - invalid response');
            }
            
            // Get the URL from the response (handle both url and secure_url formats)
            const imageUrl = imageResponse.secure_url || imageResponse.url;
            const imageId = imageResponse._id || imageResponse.publicId;
            
            // Now update the user profile with the new image URL
            const updateData = {
                profilePicture: imageUrl,
                imageId: imageId
            };
            
            console.log("[ProfileService] Updating profile with:", updateData);
            
            // Send update to server
            const response = await axiosInstance.put(`${API_URL}/${userId}`, updateData);
            
            if (!response || !response.data) {
                console.error('Failed to update profile with new image:', response);
                throw new Error('Failed to update profile with new image');
            }
            
            console.log("[ProfileService] Profile image updated successfully");
            return {
                url: imageUrl,
                _id: imageId,
                profile: response.data
            };
        } catch (error) {
            console.error('[ProfileService] Image upload error:', error);
            throw error;
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
            const response = await axiosInstance.delete(`${API_URL}/${userId}/delete-image`);
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