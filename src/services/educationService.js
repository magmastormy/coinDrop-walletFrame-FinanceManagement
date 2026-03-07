import axiosInstance from '../api/userAxios';
import ImageService from './imageService';

const API_URL = '/education';

const uploadPendingImages = async pendingImages => {
    if (!Array.isArray(pendingImages) || pendingImages.length === 0) {
        return [];
    }

    const uploaded = await Promise.all(
        pendingImages.map(async imageItem => {
            const result = await ImageService.uploadImage(imageItem.file, 'education');
            return {
                tempId: imageItem.tempId,
                preview: imageItem.preview,
                imageId: result._id || result.publicId,
                url: result.url
            };
        })
    );

    return uploaded;
};

const replaceTemporaryImageSources = (html = '', uploaded = []) => {
    let content = html;
    uploaded.forEach(item => {
        if (item.preview) {
            const escapedPreview = item.preview.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            content = content.replace(new RegExp(`src="${escapedPreview}"`, 'g'), `src="${item.url}"`);
        }
        if (item.tempId) {
            const escapedTempId = item.tempId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            content = content.replace(new RegExp(`data-temp-id="${escapedTempId}"`, 'g'), '');
        }
    });
    return content;
};

const educationService = {
    getEducations: async () => {
        const response = await axiosInstance.get(API_URL);
        return response || [];
    },

    getUserEducations: async () => {
        const response = await axiosInstance.get(`${API_URL}/user`);
        return response || [];
    },

    createEducation: async postData => {
        if (!postData.title || !postData.details) {
            throw new Error('Title and details are required');
        }

        const uploaded = await uploadPendingImages(postData.pendingImages);
        const details = replaceTemporaryImageSources(postData.details, uploaded);
        const uploadedImageIds = uploaded.map(item => item.imageId).filter(Boolean);

        const payload = {
            title: postData.title,
            details,
            images: [...(postData.existingImageIds || []), ...uploadedImageIds],
            featuredImage: postData.featuredImage || uploadedImageIds[0] || null
        };

        const response = await axiosInstance.post(API_URL, payload);
        return response;
    },

    updateEducation: async (id, postData) => {
        const uploaded = await uploadPendingImages(postData.pendingImages);
        const details = replaceTemporaryImageSources(postData.details, uploaded);
        const uploadedImageIds = uploaded.map(item => item.imageId).filter(Boolean);

        const payload = {
            ...postData,
            details,
            images: [...(postData.existingImageIds || []), ...uploadedImageIds]
        };

        delete payload.pendingImages;
        delete payload.existingImageIds;

        const response = await axiosInstance.put(`${API_URL}/${id}`, payload);
        return response;
    },

    deleteEducation: async id => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response;
    },

    likeEducation: async id => {
        const response = await axiosInstance.post(`${API_URL}/${id}/like`);
        return response;
    },

    unlikeEducation: async id => {
        const response = await axiosInstance.delete(`${API_URL}/${id}/like`);
        return response;
    },

    addComment: async (id, comment) => {
        const response = await axiosInstance.post(`${API_URL}/${id}/comments`, { text: comment });
        return response;
    },

    deleteComment: async (educationId, commentId) => {
        const response = await axiosInstance.delete(`${API_URL}/${educationId}/comments/${commentId}`);
        return response;
    }
};

export default educationService;
