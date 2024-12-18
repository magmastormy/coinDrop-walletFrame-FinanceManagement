const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const UserProfile = require('../models/UserProfile');
const Post = require('../models/Post');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile/:userId', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ user: req.params.userId })
            .populate('user', 'username email')
            .populate({
                path: 'posts',
                options: { sort: { createdAt: -1 }, limit: 10 }
            });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ profile });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/profile', [
    body('bio').optional().trim().isLength({ max: 150 }),
    body('isPrivate').optional().isBoolean(),
    body('showFinancialStats').optional().isBoolean(),
    body('showBudgetGoals').optional().isBoolean()
], async (req, res) => {
    try {
        let profile = await UserProfile.findOne({ user: req.user._id });
        if (!profile) {
            profile = new UserProfile({
                user: req.user._id,
                username: req.user.username
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'bio', 'preferences', 'financialProfile'
        ];
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                profile[field] = req.body[field];
            }
        });

        await profile.save();
        res.json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Follow/Unfollow routes
router.post('/follow/:userId', async (req, res) => {
    try {
        if (req.params.userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const [userProfile, targetProfile] = await Promise.all([
            UserProfile.findOne({ user: req.user._id }),
            UserProfile.findOne({ user: req.params.userId })
        ]);

        if (!targetProfile) {
            return res.status(404).json({ error: 'User not found' });
        }

        const followed = await userProfile.follow(req.params.userId);
        if (followed) {
            targetProfile.followers.push(req.user._id);
            await targetProfile.save();
        }

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/unfollow/:userId', async (req, res) => {
    try {
        const [userProfile, targetProfile] = await Promise.all([
            UserProfile.findOne({ user: req.user._id }),
            UserProfile.findOne({ user: req.params.userId })
        ]);

        const unfollowed = await userProfile.unfollow(req.params.userId);
        if (unfollowed) {
            targetProfile.followers = targetProfile.followers.filter(
                id => !id.equals(req.user._id)
            );
            await targetProfile.save();
        }

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Post routes
router.post('/posts', [
    body('content').trim().isLength({ min: 1, max: 500 }),
    body('visibility').isIn(['public', 'followers', 'private'])
], async (req, res) => {
    try {
        const post = new Post({
            author: req.user._id,
            content: req.body.content,
            visibility: req.body.visibility,
            category: req.body.category,
            tags: req.body.tags,
            media: req.body.media
        });

        await post.save();

        // Update user profile
        const profile = await UserProfile.findOne({ user: req.user._id });
        profile.posts.push(post._id);
        await profile.save();

        res.status(201).json({ post });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/posts/feed', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ user: req.user._id });
        const following = userProfile.following;

        const posts = await Post.find({
            $or: [
                { author: { $in: following }, visibility: { $in: ['public', 'followers'] } },
                { author: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'username profilePicture');

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like/Unlike routes
router.post('/posts/:postId/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.like(req.user._id);
        res.json({ message: 'Post liked successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/posts/:postId/unlike', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.unlike(req.user._id);
        res.json({ message: 'Post unliked successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Comment routes
router.post('/posts/:postId/comments', [
    body('content').trim().isLength({ min: 1, max: 200 })
], async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = await post.addComment(req.user._id, req.body.content);
        res.status(201).json({ comment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's followers/following
router.get('/profile/:userId/followers', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ user: req.params.userId })
            .populate('followers', 'username profilePicture');
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ followers: profile.followers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/profile/:userId/following', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ user: req.params.userId })
            .populate('following', 'username profilePicture');
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ following: profile.following });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
