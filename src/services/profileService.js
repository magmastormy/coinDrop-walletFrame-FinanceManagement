import axiosInstance from '../api/userAxios';
import ImageService from '../services/imageService';

const API_URL = '/profile';

const profileService = {
    getUserProfile: async () => {
        try {
            const response = await axiosInstance.get(`${API_URL}/me`);
            return response;
        } catch (error) {
            if (error.response?.status === 404) {
                const createResponse = await profileService.createUserProfile({
                    bio: '',
                    interests: [],
                    phone: ''
                });
                return createResponse;
            }
            throw new Error(error.response?.data?.error || 'Failed to fetch profile');
        }
    },

    updateUserProfile: async (profileData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/me`, profileData);
            return response;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update profile');
        }
    },

    createUserProfile: async (profileData) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/me`, profileData);
            return response;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to create profile');
        }
    },

    uploadProfileImage: async (file) => {
        if (!file || !file.name || !file.type || !file.type.startsWith('image/')) {
            throw new Error('Invalid file format - must be an image file');
        }

        const imageResponse = await ImageService.uploadImage(file, 'profile');
        if (!imageResponse?.url) {
            throw new Error('Failed to upload image - invalid response');
        }

        const updatedProfile = await profileService.updateUserProfile({
            profilePicture: imageResponse.url,
            imageId: imageResponse._id || imageResponse.publicId
        });

        return {
            url: imageResponse.url,
            profile: updatedProfile?.profile || {}
        };
    },

    deleteUserProfile: async () => {
        const response = await axiosInstance.delete(`${API_URL}/me`);
        return response;
    },

    deleteProfileImage: async (type = 'profile') => {
        const response = await axiosInstance.delete(`${API_URL}/me/delete-image?type=${type}`);
        return response;
    }
};

export default profileService;
