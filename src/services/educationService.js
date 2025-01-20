import axiosInstance from '../api/userAxios';
import imageCompression from 'browser-image-compression';

const API_URL = '/education';

const compressImage = async (file) => {
    if (!file ||!file.type.startsWith('image/')) return file;

    const options = {
        maxSizeMB: 1, // Max file size of 1MB
        maxWidthOrHeight: 1920, // Max width/height of 1920px
        useWebWorker: true,
        fileType: 'image/jpeg' // Convert all images to JPEG for consistency
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log('compressImage: Image compressed successfully', compressedFile);
        return compressedFile;
    } catch (error) {
        console.error('compressImage: Error compressing image:', error);
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
        console.log('uploadImage: Image uploaded successfully', response.data);
        return response.data;
    } catch (error) {
        console.error('uploadImage: Error uploading image:', error);
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
            console.error('Education Service - getEducations: Error fetching educations:', error);
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
            console.error('Education Service - getUserEducations: Error fetching user educations:', error);
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
            console.log('createEducation: Education created successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('createEducation: Error creating education:', error);
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
            console.log('updateEducation: Education updated successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('updateEducation: Error updating education:', error);
            throw error;
        }
    },

    deleteEducation: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log('deleteEducation: Education deleted successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('deleteEducation: Error deleting education:', error);
            throw error;
        }
    },

    likeEducation: async (id) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/${id}/like`);
            console.log('likeEducation: Education liked successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('likeEducation: Error liking education:', error);
            throw error;
        }
    },

    unlikeEducation: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}/like`);
            console.log('unlikeEducation: Education unliked successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('unlikeEducation: Error unliking education:', error);
            throw error;
        }
    },

    addComment: async (id, comment) => {
        try {
            const response = await axiosInstance.post(`${API_URL}/${id}/comments`, { content: comment });
            console.log('addComment: Comment added successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('addComment: Error adding comment:', error);
            throw error;
        }
    },

    deleteComment: async (educationId, commentId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${educationId}/comments/${commentId}`);
            console.log('deleteComment: Comment deleted successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('deleteComment: Error deleting comment:', error);
            throw error;
        }
    }
};

export default educationService;