const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    format: {
        type: String
    },
    resourceType: {
        type: String,
        default: 'image'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageType: {
        type: String,
        enum: ['education', 'profile', 'cover'],
        default: 'education'
    }
}, { timestamps: true });

ImageSchema.index({ uploadedBy: 1 });
ImageSchema.index({ imageType: 1 });

module.exports = mongoose.model('Image', ImageSchema);