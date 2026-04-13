import { useLogger } from '../hooks/useLogger.jsx';

import axiosInstance from '../api/userAxios';

const API_URL = '/images'; 

const imageService = {
    uploadImage: async (file, imageType = 'education') => {
        try {
            if (!file) {
                throw new Error('No file provided');
            }
            
            // More flexible file validation
            if (!file.name || !file.type || !file.type.startsWith('image/')) {
                throw new Error('Invalid file format - must be an image file');
            }
            
            logInfo(`[ImageService] Uploading ${imageType} image:`, file.name);
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('imageType', imageType);
            
            const response = await axiosInstance.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Log the full response for debugging
            logInfo(`[Step One: Full response from Cloudinary] [ImageService - AFTER UPLOADING TO CLOUDINARY] Server response:`, response);
            
            // Fixed condition - if we have a response object at all, process it
            if (response) {
                logInfo(`[Step Two: Checking if we have a response from Cloudinary] [ImageService - AFTER UPLOADING TO CLOUDINARY] ${imageType} image uploaded successfully:`, response);
                return response;
            } else {
                logError('[Step Three: Error uploading to Cloudinary] [ImageService - AFTER UPLOADING TO CLOUDINARY] Empty response data:', response);
                throw new Error('No data received from server');
            }
        } catch (error) {
            logError(`[Step Four: Final Error outside main Try-Catch] [ImageService - AFTER UPLOADING TO CLOUDINARY] Error uploading ${imageType} image:`, error);
            throw error;
        }
    },

    deleteImage: async (imageId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${imageId}`);
            return response;
        } catch (error) {
            logError('Error deleting image:', error);
            throw error;
        }
    }
};

export default imageService;
