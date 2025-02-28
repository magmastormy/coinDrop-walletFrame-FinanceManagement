import axiosInstance from '../api/userAxios';
import imageCompression from 'browser-image-compression';

const API_URL = '/images';

const imageService = {
    uploadImage: async (file, imageType = 'education') => {
        try {
            let fileToUpload = file;
            
            // Only compress if it's a File object
            if (file instanceof File) {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/jpeg'
                };
                fileToUpload = await imageCompression(file, options);
            }

            const formData = new FormData();
            formData.append('image', fileToUpload);
            formData.append('imageType', imageType);

            // Always use Cloudinary for education posts
            if (imageType === 'education') {
                formData.append('storage', 'cloudinary');
            }

            const response = await axiosInstance.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    deleteImage: async (imageId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${imageId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }
};

export default imageService;