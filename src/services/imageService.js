import axiosInstance from "../api/userAxios.js";
import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) return file;
    console.log("[ImageService] Compressing image:", file);
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg'
    };

    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Error compressing image:', error);
        return file;
    }
};

class ImageService {
    static async uploadImage(file, imageType = 'education') {
        try {
            const compressedFile = await compressImage(file);
            console.log("[ImageService] Compressed file:", compressedFile);

            const formData = new FormData();
            formData.append('image', compressedFile);
            formData.append('imageType', imageType);

            const response = await axiosInstance.post('/images/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log("[ImageService] Upload response:", response);
            console.log("[ImageService] Upload response data:", response.data);
            if (response.data && response.data.profile) {
                return response.data;
            } else {
                throw new Error('[ImageService] Invalid response format from server');
            }
        } catch (error) {
            throw new Error(`[ImageService] Failed to upload image: ${error.message}`);
        }
    }

    static async deleteImage(imageId) {
        try {
            await axiosInstance.delete(`/images/${imageId}`);
        } catch (error) {
            throw new Error(`[ImageService] Failed to delete image: ${error.message}`);
        }
    }
}

export default ImageService;