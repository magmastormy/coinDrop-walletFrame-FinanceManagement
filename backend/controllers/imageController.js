const cloudinary = require('cloudinary').v2;
const Image = require('../models/Image');
const { getUploadOptions } = require('../config/cloudinary');

class ImageController {
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            const userId = req.user._id || req.query.userId || req.user.userId;
            const imageType = req.body.imageType || 'education';
            const options = getUploadOptions(imageType);

            const result = await cloudinary.uploader.upload(req.file.path, options);

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
            const image = await Image.findById(req.params.id);
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