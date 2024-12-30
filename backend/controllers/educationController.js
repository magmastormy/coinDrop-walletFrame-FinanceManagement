const Education = require('../models/Education');

class EducationController {
    static async createEducation(req, res) {
        try {
            const education = new Education({
                ...req.body,
                author: req.user._id
            });
            await education.save();
            res.status(201).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getEducations(req, res) {
        try {
            const educations = await Education.find().populate('author', 'username');
            res.status(200).json(educations);
        } catch (error) {
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
            const education = await Education.findById(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            if (education.likes.includes(req.user._id)) {
                education.likes.pull(req.user._id);
            } else {
                education.likes.push(req.user._id);
            }
            await education.save();
            res.status(200).json(education);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async addComment(req, res) {
        try {
            const education = await Education.findById(req.params.id);
            if (!education) {
                return res.status(404).json({ error: 'Education post not found' });
            }
            const comment = {
                user: req.user._id,
                text: req.body.text
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