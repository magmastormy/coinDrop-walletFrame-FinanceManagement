const cloudinary = require('cloudinary').v2;
const Image = require('../models/Image');
const { getUploadOptions } = require('../config/cloudinary');
const { getAuthenticatedUserId } = require('../utils/authUser');

class ImageController {
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            // Ensure we have the file path
            const filePath = req.file.path || req.file.tempFilePath;
            if (!filePath) {
                return res.status(400).json({ error: 'Invalid file format' });
            }

            const userId = getAuthenticatedUserId(req);
            const imageType = req.body.imageType || 'education';
            const options = getUploadOptions(imageType);

            const result = await cloudinary.uploader.upload(filePath, options);

            const image = new Image({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                resourceType: result.resource_type,
                uploadedBy: userId,
                imageType
            });

            await image.save();

            res.json(image);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteImage(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const image = await Image.findOne({ _id: req.params.id, uploadedBy: userId });
            if (!image) {
                return res.status(404).json({ error: 'Image not found' });
            }

            await cloudinary.uploader.destroy(image.publicId);
            await image.remove();

            res.json({ message: 'Image deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = ImageController;
