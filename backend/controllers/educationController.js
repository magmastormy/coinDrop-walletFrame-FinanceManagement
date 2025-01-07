const Education = require('../models/Education');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
class EducationController {

    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'education',
                resource_type: 'image',
                transformation: [
                    { width: 1200, crop: 'limit' },
                    { quality: 'auto' }
                ]
            });

            // Clean up local file after upload
            await fs.unlink(req.file.path);

            res.json({ 
                url: result.secure_url,
                public_id: result.public_id
            });
        } catch (error) {
            // Clean up local file if upload failed
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            res.status(400).json({ error: error.message });
        }
    }

    static async createEducation(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const education = new Education({
                ...req.body,
                author: userId,
                contentType: 'tiptap'
            });
            await education.save();
            res.status(201).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }


    static async getEducations(req, res) {
        try {
            const educations = await Education.find({})
                .populate('author', 'username firstName lastName profilePicture')
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
            const education = await Education.findById(req.params.id).populate('author', 'username');
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
            const education = await Education.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            res.status(200).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteEducation(req, res) {
        try {
            const education = await Education.findByIdAndDelete(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
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