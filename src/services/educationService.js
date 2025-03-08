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
            if (!postData.title || !postData.details) {
                throw new Error('Title and details are required');
            }

            console.log("[educationService - createEducation] Post data:", postData);
            
            // Upload any pending images first
            let uploadedImageIds = [];
            let contentHtml = postData.details;
            
            if (postData.pendingImages && postData.pendingImages.length > 0) {
                console.log("Uploading pending images:", postData.pendingImages.length);
                
                // Upload each pending image
                const uploadResults = await Promise.all(
                    postData.pendingImages.map(async (imageItem) => {
                        try {
                            const result = await ImageService.uploadImage(imageItem.file, 'education');
                            
                            if (result && result.url) {
                                // If this image has a tempId, replace all instances in the HTML content
                                if (imageItem.tempId) {
                                    // Replace the temporary preview URL with the real URL in the content HTML
                                    const regex = new RegExp(`src="${escapeRegExp(imageItem.preview)}"`, 'g');
                                    contentHtml = contentHtml.replace(regex, `src="${result.url}"`);
                                    
                                    // Also look for data-temp-id attribute
                                    const tempIdRegex = new RegExp(`data-temp-id="${escapeRegExp(imageItem.tempId)}"`, 'g');
                                    contentHtml = contentHtml.replace(tempIdRegex, '');
                                }
                                
                                return {
                                    success: true,
                                    imageId: result._id,
                                    originalTempId: imageItem.tempId,
                                    url: result.url
                                };
                            }
                            return { success: false, error: 'No URL in response' };
                        } catch (error) {
                            console.error("Failed to upload image:", error);
                            return { success: false, error: error.message };
                        }
                    })
                );
                
                // Collect successfully uploaded image IDs
                uploadedImageIds = uploadResults
                    .filter(result => result.success && result.imageId)
                    .map(result => result.imageId);
                    
                console.log("Successfully uploaded images:", uploadedImageIds.length);
            }
            
            // Combine with any existing image IDs
            const allImageIds = [
                ...(postData.existingImageIds || []),
                ...uploadedImageIds
            ];
            
            // Create the data object to send to the API
            const dataToSend = {
                title: postData.title,
                details: contentHtml, // Use the updated HTML with real image URLs
                images: allImageIds,
                featuredImage: allImageIds.length > 0 ? allImageIds[0] : null
            };
            
            if (postData._id) {
                dataToSend._id = postData._id;
            }
            
            console.log("Sending post data with images:", dataToSend);
            
            const response = await axiosInstance.post(API_URL, dataToSend);
            
            if (!response || !response.data) {
                throw new Error('No data returned from server');
            }
            
            console.log('createEducation: Post created successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('createEducation: Error creating education post:', error);
            throw error;
        }
    },

    updateEducation: async (id, postData) => {
        try {
            // Extract image files and existing images
            const { images, existingImages, ...postDataWithoutImages } = postData;
            
            // Create a new object with just the necessary data
            const updateData = {
                ...postDataWithoutImages
            };
            
            // Handle image uploads if new images are present
            let imageUrls = [];
            if (images && images.length > 0) {
                imageUrls = await Promise.all(
                    images.map(async (file, index) => {
                        try {
                            const imageResponse = await ImageService.uploadImage(file);
                            console.log(`New image ${index + 1} uploaded successfully:`, imageResponse);
                            return imageResponse.url;
                        } catch (error) {
                            console.error(`Failed to upload new image ${index + 1}:`, error);
                            return null;
                        }
                    })
                );
                
                // Filter out any failed uploads
                imageUrls = imageUrls.filter(url => url !== null);
            }
            
            // Combine new image URLs with existing ones
            let allImages = [];
            
            if (existingImages && existingImages.length > 0) {
                allImages = existingImages.map(url => ({ url }));
            }
            
            if (imageUrls.length > 0) {
                allImages = [...allImages, ...imageUrls.map(url => ({ url }))];
            }
            
            // Add images array if we have any images
            if (allImages.length > 0) {
                updateData.images = allImages;
            }
            
            const response = await axiosInstance.put(`${API_URL}/${id}`, updateData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('updateEducation: Post updated successfully', response);
            return response;
        } catch (error) {
            console.error('updateEducation: Error updating education:', error);
            throw error;
        }
    },

    deleteEducation: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${id}`);
            console.log('deleteEducation: Post deleted successfully', response);
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
            // Change 'content' to 'text' to match backend validation
            const response = await axiosInstance.post(`${API_URL}/${id}/comments`, { text: comment });
            console.log('addComment: Comment added successfully', response.data);
            return response.data;
        } catch (error) {
            console.error('addComment: Error adding comment:', error);
            
            // Improve error handling to show validation errors
            if (error.response?.data?.details) {
                console.error('Comment validation details:', error.response.data.details);
                const errorMessages = error.response.data.details.map(detail => detail.message).join(', ');
                throw new Error(errorMessages || 'Validation failed');
            }
            
            throw error;
        }
    },

    deleteComment: async (educationId, commentId) => {
        try {
            const response = await axiosInstance.delete(`${API_URL}/${educationId}/comments/${commentId}`);
            console.log('deleteComment: Comment deleted successfully', response);
            return response;
        } catch (error) {
            console.error('deleteComment: Error deleting comment:', error);
            throw error;
        }
    }
};

// Helper function for escaping special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default educationService;