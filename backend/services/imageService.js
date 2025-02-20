const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

class ImageService {
    static async uploadImage(file, imageType = 'education') {
        try {
            if (imageType === 'education') {
                // Use Cloudinary for education posts
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'education',
                    resource_type: 'auto'
                });
                return result;
            } else {
                // Use local storage for other images
                const uploadDir = path.join(__dirname, '../uploads', imageType);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const fileName = `${Date.now()}-${file.originalname}`;
                const filePath = path.join(uploadDir, fileName);
                
                await fs.promises.copyFile(file.path, filePath);
                await fs.promises.unlink(file.path); // Clean up temp file

                return {
                    public_id: fileName,
                    url: `/uploads/${imageType}/${fileName}`,
                    secure_url: `/uploads/${imageType}/${fileName}`
                };
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    static async deleteImage(imageId, imageType = 'education') {
        try {
            if (imageType === 'education') {
                // Delete from Cloudinary
                await cloudinary.uploader.destroy(imageId);
            } else {
                // Delete from local storage
                const filePath = path.join(__dirname, '../uploads', imageType, imageId);
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }
}

module.exports = ImageService;
