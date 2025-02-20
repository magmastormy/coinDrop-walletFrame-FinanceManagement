import axiosInstance from '../api/userAxios';
import imageCompression from 'browser-image-compression';
import ImageService from './imageService';

const API_URL = '/education';

const educationService = {
    getEducations: async () => {
        try {
            const response = await axiosInstance.get(API_URL);
            console.log('Education Service - getEducations - Response:', response);
            return response.data;
        } catch (error) {
            console.error('Education Service - getEducations: Error fetching educations:', error);
            throw error;
        }
    },

    getUserEducations: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/user/${userId}`);
            console.log('Education Service - getUserEducations - Response:', response);
            return response.data;
        } catch (error) {
            console.error('Education Service - getUserEducations: Error fetching user educations:', error);
            throw error;
        }
    },

    createEducation: async (postData) => {
        try {
            if (!postData.title || !postData.details || !postData.category) {
                throw new Error('Title, details, and category are required');
            }

            // First create the post without images
            const { images, ...postDataWithoutImages } = postData;
            const formData = new FormData();
            
            // Append post data
            Object.keys(postDataWithoutImages).forEach(key => {
                formData.append(key, postDataWithoutImages[key]);
            });

            // Handle image uploads if present
            if (images && images.length > 0) {
                const imageUrls = await Promise.all(
                    images.map(async (file, index) => {
                        try {
                            const imageResponse = await ImageService.uploadImage(file);
                            console.log(`Image ${index + 1} uploaded successfully:`, imageResponse);
                            return imageResponse.url;
                        } catch (error) {
                            console.error(`Failed to upload image ${index + 1}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out any failed uploads
                const successfulUrls = imageUrls.filter(url => url !== null);
                if (successfulUrls.length > 0) {
                    formData.append('images', JSON.stringify(successfulUrls));
                }
            }

            // Create the post with all data
            const response = await axiosInstance.post(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('createEducation: Post created successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('createEducation: Error creating education:', error);
            if (error.response?.data?.details) {
                throw new Error(error.response.data.details[0]?.message || 'Validation failed');
            }
            throw error;
        }
    },

    updateEducation: async (id, postData) => {
        try {
            const { images, ...postDataWithoutImages } = postData;
            
            // First update the post data
            const formData = new FormData();
            
            // Append post data
            Object.keys(postDataWithoutImages).forEach(key => {
                formData.append(key, postDataWithoutImages[key]);
            });

            // Handle image uploads if present
            if (images && images.length > 0) {
                const imageUrls = await Promise.all(
                    images.map(async (file, index) => {
                        try {
                            const imageResponse = await ImageService.uploadImage(file);
                            console.log(`Image ${index + 1} uploaded successfully:`, imageResponse);
                            return imageResponse.url;
                        } catch (error) {
                            console.error(`Failed to upload image ${index + 1}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out any failed uploads
                const successfulUrls = imageUrls.filter(url => url !== null);
                if (successfulUrls.length > 0) {
                    formData.append('images', JSON.stringify(successfulUrls));
                }
            }

            const response = await axiosInstance.patch(`${API_URL}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('updateEducation: Post updated successfully', response.data);
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