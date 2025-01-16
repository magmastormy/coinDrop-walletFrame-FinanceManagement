import axiosInstance from "../api/userAxios";
import imageCompression from 'browser-image-compression';

class ImageService {
    static async compressImage(file) {
        if (!file || !file.type.startsWith('image/')) return file;

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
    }

    static async uploadImage(file, imageType = 'education') {
        try {
            const compressedFile = await this.compressImage(file);
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
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    static async deleteImage(imageId) {
        try {
            await axiosInstance.delete(`/images/${imageId}`);
        } catch (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

export default ImageService;