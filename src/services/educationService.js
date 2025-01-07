import axiosInstance from '../api/userAxios';
import imageCompression from 'browser-image-compression';

const API_URL = '/education';

const compressImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) return file;

    const options = {
        maxSizeMB: 1, // Max file size of 1MB
        maxWidthOrHeight: 1920, // Max width/height of 1920px
        useWebWorker: true,
        fileType: 'image/jpeg' // Convert all images to JPEG for consistency
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        return file;
    }
};

const educationService = {
    getEducations: async () => {
        try {
            const response = await axiosInstance.get(API_URL);
            console.log('Education Service - getEducations - Response:', response);
            console.log('Education Service - getEducations - Response data:', response.data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    getUserEducations: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user/${userId}`);
            console.log('Education Service - getUserEducations - Response:', response);
            console.log('Education Service - getUserEducations - Response data:', response.data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    createEducation: async (postData) => {
        try {
            let formData = new FormData();
            
            // Handle text data
            formData.append('title', postData.title);
            formData.append('details', postData.details);
            formData.append('category', postData.category);
            
            // Handle images
            if (postData.images && postData.images.length > 0) {
                for (let image of postData.images) {
                    const compressedImage = await compressImage(image);
                    formData.append('images', compressedImage);
                }
            }

            const response = await axiosInstance.post(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateEducation: async (id, postData) => {
        try {
            let formData = new FormData();
            
            // Handle text data
            formData.append('title', postData.title);
            formData.append('details', postData.details);
            formData.append('category', postData.category);
            
            // Handle images
            if (postData.images && postData.images.length > 0) {
                for (let image of postData.images) {
                    // Only compress if it's a new image (File object)
                    if (image instanceof File) {
                        const compressedImage = await compressImage(image);
                        formData.append('images', compressedImage);
                    } else {
                        formData.append('existingImages', image);
                    }
                }
            }

            const response = await axiosInstance.put(`${API_URL}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteEducation: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    likeEducation: async (id) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/${id}/like`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    unlikeEducation: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}/like`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addComment: async (id, comment) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/${id}/comments`, { content: comment });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteComment: async (educationId, commentId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${educationId}/comments/${commentId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default educationService;