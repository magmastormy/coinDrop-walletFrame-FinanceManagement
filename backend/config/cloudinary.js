const cloudinary = require('cloudinary').v2;

const initCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

const getUploadOptions = (imageType) => {
    const baseOptions = {
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    };

    switch (imageType) {
        case 'education':
            return {
                ...baseOptions,
                folder: 'coinDrop_education',
                transformation: [
                    ...baseOptions.transformation,
                    { width: 1200, crop: 'limit' }
                ]
            };
        case 'profile':
            return {
                ...baseOptions,
                folder: 'coinDrop_profile',
                transformation: [
                    ...baseOptions.transformation,
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' }
                ]
            };
        case 'cover':
            return {
                ...baseOptions,
                folder: 'coinDrop_cover',
                transformation: [
                    ...baseOptions.transformation,
                    { width: 1200, height: 300, crop: 'fill' }
                ]
            };
        default:
            return baseOptions;
    }
};

module.exports = {
    cloudinary,
    getUploadOptions,
    initCloudinary: initCloudinary
};