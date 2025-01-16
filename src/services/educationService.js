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

const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        const compressedImage = await compressImage(file);
        formData.append('image', compressedImage);

        const response = await axiosInstance.post(`${API_URL}/upload-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const educationService = {
    uploadImage,
    compressImage,
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
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('details', postData.details);
            formData.append('category', postData.category);
            
            // Handle image IDs instead of files
            if (postData.images) {
                formData.append('images', JSON.stringify(postData.images));
            }
            if (postData.featuredImage) {
                formData.append('featuredImage', postData.featuredImage);
            }

            const response = await axiosInstance.post(API_URL, formData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateEducation: async (id, postData) => {
        try {
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('details', postData.details);
            formData.append('category', postData.category);
            
            if (postData.images) {
                formData.append('images', JSON.stringify(postData.images));
            }
            if (postData.featuredImage) {
                formData.append('featuredImage', postData.featuredImage);
            }

            const response = await axiosInstance.put(`${API_URL}/${id}`, formData);
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