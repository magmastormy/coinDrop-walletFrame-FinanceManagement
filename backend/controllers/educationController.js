const Education = require('../models/Education');
const cloudinary = require('cloudinary').v2;
const ImageService = require("../../src/services/imageService");
const fs = require('fs').promises;
class EducationController {

    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            const userId = req.user._id || req.query.userId || req.user.userId;
            
            const image = await ImageService.uploadImage(
                req.file, 
                userId,
                'education'
            );

            res.json({
                url: image.url,
                public_id: image.publicId,
                _id: image._id
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }


    static async createEducation(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const { title, details, images, featuredImage } = req.body;

            const education = new Education({
                title,
                details,
                author: userId,
                images: images || [],
                featuredImage: featuredImage,
                contentType: 'tiptap'
            });

            await education.save();
            await education.populate('author images featuredImage');
            
            res.status(201).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }


    static async getEducations(req, res) {
        try {
            const educations = await Education.find({})
                .populate('author', 'username firstName lastName profilePicture')
                .populate('images')
                .populate('featuredImage')
                .sort({ createdAt: -1 });
                
            res.status(200).json({
                status: 'success',
                data: educations
            });
        } catch (error) {
            console.error('Error fetching education posts:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async getUserEducations(req, res) {
        try {
            const userId = req.params.userId || req.user._id || req.query.userId || req.user.userId;
            const educations = await Education.find({ author: userId })
                .populate('author', 'username firstName lastName profilePicture')
                .populate('images')
                .populate('featuredImage')
                .sort({ createdAt: -1 });
                
            res.status(200).json({
                status: 'success',
                data: educations
            });
        } catch (error) {
            console.error('Error fetching user education posts:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async getEducationById(req, res) {
        try {
            const education = await Education.findById(req.params.id)
                .populate('author', 'username firstName lastName profilePicture')
                .populate('images')
                .populate('featuredImage')
                .populate({
                    path: 'comments.user',
                    select: 'username profilePicture'
                });

            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            res.status(200).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateEducation(req, res) {
        try {
            const { title, details, category, images, featuredImage } = req.body;
            const education = await Education.findById(req.params.id);
            
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }

            // Handle image deletions if any
            const oldImages = education.images || [];
            const newImages = images || [];
            const imagesToDelete = oldImages.filter(img => !newImages.includes(img.toString()));
            
            for (const imageId of imagesToDelete) {
                await ImageService.deleteImage(imageId);
            }

            const updatedEducation = await Education.findByIdAndUpdate(
                req.params.id,
                { title, details, category, images, featuredImage },
                { new: true }
            ).populate('author images featuredImage');

            res.status(200).json(updatedEducation);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteEducation(req, res) {
        try {
            const education = await Education.findById(req.params.id)
                .populate('images')
                .populate('featuredImage');
                
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }

            // Delete associated images
            const images = [...(education.images || []), education.featuredImage]
                .filter(Boolean);

            for (const image of images) {
                await ImageService.deleteImage(image._id);
            }

            await education.remove();
            res.status(200).json({ message: 'Education post deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async likeEducation(req, res) {
        try {

            const userId = req.user._id || req.query.userId || req.user.userId;

            const education = await Education.findById(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }

            const likeIndex = education.likes.indexOf(userId);

            if (likeIndex === -1) {
                education.likes.push(userId);
            } else {
                education.likes.splice(likeIndex, 1);
            }

            await education.save();
            res.json({
                message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
                likeCount: education.likes.length
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async addComment(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const education = await Education.findById(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            const comment = {
                user: userId,
                text: req.body.text,
                date: new Date().toISOString()
            };
            education.comments.push(comment);
            await education.save();

            res.status(201).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteComment(req, res) {
        try {
            const education = await Education.findById(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            const comment = education.comments.id(req.params.commentId);
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            comment.remove();
            await education.save();
            res.status(200).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = EducationController;