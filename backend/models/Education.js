const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100
    },
    details: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 1000000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    featuredImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    },
    contentType: {
        type: String,
        enum: ['markdown', 'tiptap'],
        default: 'tiptap'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Indexes for performance
EducationSchema.index({ author: 1, createdAt: -1 });
EducationSchema.index({ title: 'text' });
EducationSchema.index({ details: 'text' });
EducationSchema.index({ date: -1 });

module.exports = mongoose.model('Education', EducationSchema);