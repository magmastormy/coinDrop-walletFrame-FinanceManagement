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

            return response.data;
        } catch (error) {
            console.error('[ImageService] Upload error:', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    static async deleteImage(imageId) {
        try {
            const response = await axiosInstance.delete(`/images/${imageId}`);
            return response.data;
        } catch (error) {
            console.error('[ImageService] Delete error:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

export default ImageService;