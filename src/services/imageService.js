const Image = require('../../backend/models/Image');
const { cloudinary, uploadOptions } = require('../../backend/config/cloudinary');

class ImageService {
    static async uploadImage(file, userId, imageType, customOptions = {}) {
        try {
          const options = {
            ...uploadOptions(imageType),
            ...customOptions
          };
    
          const result = await cloudinary.uploader.upload(file.path, options);
          
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
    
          // Clean up local file
          await fs.unlink(file.path);
    
          return image;
        } catch (error) {
          // Clean up local file if upload failed
          if (file.path) {
            await fs.unlink(file.path).catch(console.error);
          }
          throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    static async deleteImage(imageId) {
        try {
        const image = await Image.findById(imageId);
        if (!image) return;

        await cloudinary.uploader.destroy(image.publicId);
        await image.remove();
        } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
        }
    }


    static async replaceImage(oldImageId, file, userId, imageType) {
        try {
        // Delete old image if it exists
        if (oldImageId) {
            await this.deleteImage(oldImageId);
        }

        // Upload new image
        return await this.uploadImage(file, userId, imageType);
        } catch (error) {
        throw new Error(`Failed to replace image: ${error.message}`);
        }
    }

    static async deleteMultipleImages(publicIds) {
        try {
        await cloudinary.api.delete_resources(publicIds);
        await Image.deleteMany({ publicId: { $in: publicIds } });
        } catch (error) {
        throw new Error(`Failed to delete images: ${error.message}`);
        }
    }
}

module.exports = ImageService;