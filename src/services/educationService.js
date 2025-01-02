import axiosInstance from "../api/userAxios";
const API_URL = '/education';

const compressImage = async (file) => {
    if (!file.type.startsWith('image/')) {
        return file;
    }
    
    try {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file;
    }
};

const educationService = {

    getEducations: async () => {
        const response = await axiosInstance.get(API_URL);
        return response;
    },

    createEducation: async (educationData) => {
        const imagePromises = educationData.images?.map(async file => {
            if (file instanceof File) {
                return await educationService.uploadImage(file);
            }
            return file;
        });

        const uploadedImages = imagePromises ? await Promise.all(imagePromises) : [];
        
        const response = await axiosInstance.post(API_URL, {
            ...educationData,
            images: uploadedImages,
            contentType: 'tiptap'
        });
        return response;
    },

    uploadImage: async (file) => {
        try {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedFile);
            
            const response = await axiosInstance.post(`${API_URL}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                maxBodyLength: 10 * 1024 * 1024 // 10MB
            });
            return response.data.url;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    },

    updateEducation: async (id, educationData) => {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid education ID');
        }
        
        try {
            const response = await axiosInstance.put(`${API_URL}/${id}`, {
                ...educationData,
                contentType: 'tiptap'
            });
            return response.data;
        } catch (error) {
            console.error('Update education error:', error);
            throw error;
        }
    },

    getUserEducations: async (userId) => {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        return response;
    },

    deleteEducation: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    likeEducation: async (educationId) => {
        if (!educationId || typeof educationId !== 'string') {
            throw new Error('Invalid education ID');
        }

        try {
            const response = await axiosInstance.post(`${API_URL}/${educationId}/like`);
            return response.data;
        } catch (error) {
            console.error('Like education error:', error);
            throw error;
        }
    },
    
    addComment: async (educationId, commentData) => {
        if (!educationId || typeof educationId !== 'string') {
            throw new Error('Invalid education ID');
        }

        if (!commentData?.text || typeof commentData.text !== 'string') {
            throw new Error('Comment text is required');
        }

        try {
            const response = await axiosInstance.post(
                `${API_URL}/${educationId}/comments`,
                { text: commentData.text }
            );
            return response.data;
        } catch (error) {
            console.error('Add comment error:', error);
            throw error;
        }
    },
};

export default educationService;