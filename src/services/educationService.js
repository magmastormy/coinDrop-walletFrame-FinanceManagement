import axiosInstance from "../api/userAxios";
const API_URL = '/education';

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
        return response.data;
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axiosInstance.post(`${API_URL}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.url;
    },

    updateEducation: async (id, educationData) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, educationData);
        return response.data;
    },

    getUserEducations: async (userId) => {
        const response = await axiosInstance.get(`${API_URL}?userId=${userId}`);
        return response;
    },

    deleteEducation: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },
};

export default educationService;