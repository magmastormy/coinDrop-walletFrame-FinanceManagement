const CommunityPost = require('../models/Community');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Post = require('../models/Post');

class CommunityController {
    // Create a new post
    static async createPost(req, res) {
        try {
            const postData = {
                ...req.body,
                author: req.user._id
            };

            const post = new CommunityPost(postData);
            await post.save();

            res.status(201).json({
                message: 'Post created successfully',
                post
            });
        } catch (error) {
            res.status(400).json({
                error: 'Post creation failed',
                details: error.message
            });
        }
    }

    // Get posts with advanced filtering
    static async getPosts(req, res) {
        try {
            const { 
                category, 
                tags, 
                limit = 10, 
                page = 1, 
                sortBy = 'createdAt', 
                sortOrder = 'desc' 
            } = req.query;

            const filter = {};
            if (category) filter.category = category;
            if (tags) filter.tags = { $in: tags.split(',') };

            const posts = await CommunityPost.find(filter)
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .populate('author', 'username profilePicture')
                .populate({
                    path: 'comments.author',
                    select: 'username profilePicture'
                });

            const total = await CommunityPost.countDocuments(filter);

            res.json({
                posts,
                totalPosts: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve posts',
                details: error.message
            });
        }
    }

    // Get a specific post by ID
    static async getPostById(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.id)
                .populate('author', 'username profilePicture')
                .populate({
                    path: 'comments.author',
                    select: 'username profilePicture'
                });

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.json(post);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve post',
                details: error.message
            });
        }
    }

    // Update a post
    static async updatePost(req, res) {
        try {
            const post = await CommunityPost.findOneAndUpdate(
                { _id: req.params.id, author: req.user._id },
                req.body,
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (!post) {
                return res.status(404).json({ 
                    error: 'Post not found or unauthorized' 
                });
            }

            res.json({
                message: 'Post updated successfully',
                post
            });
        } catch (error) {
            res.status(400).json({
                error: 'Post update failed',
                details: error.message
            });
        }
    }

    // Delete a post
    static async deletePost(req, res) {
        try {
            const post = await CommunityPost.findOneAndDelete({
                _id: req.params.id,
                author: req.user._id
            });

            if (!post) {
                return res.status(404).json({ 
                    error: 'Post not found or unauthorized' 
                });
            }

            res.json({
                message: 'Post deleted successfully',
                post
            });
        } catch (error) {
            res.status(500).json({
                error: 'Post deletion failed',
                details: error.message
            });
        }
    }

    // Add a comment to a post
    static async addComment(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const newComment = {
                author: req.user._id,
                content: req.body.content
            };

            post.comments.push(newComment);
            await post.save();

            // Populate the newly added comment's author
            await post.populate({
                path: 'comments.author',
                select: 'username profilePicture'
            });

            // Find the last added comment
            const addedComment = post.comments[post.comments.length - 1];

            res.status(201).json({
                message: 'Comment added successfully',
                comment: addedComment
            });
        } catch (error) {
            res.status(400).json({
                error: 'Comment creation failed',
                details: error.message
            });
        }
    }

    // Delete a comment
    static async deleteComment(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Find comment index
            const commentIndex = post.comments.findIndex(
                comment => 
                    comment._id.toString() === req.params.commentId && 
                    comment.author.toString() === req.user._id.toString()
            );

            if (commentIndex === -1) {
                return res.status(404).json({ error: 'Comment not found or unauthorized' });
            }

            // Remove comment
            post.comments.splice(commentIndex, 1);
            await post.save();

            res.json({
                message: 'Comment deleted successfully',
                commentId: req.params.commentId
            });
        } catch (error) {
            res.status(500).json({
                error: 'Comment deletion failed',
                details: error.message
            });
        }
    }

    // Like/Unlike a post
    static async toggleLike(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const userId = req.user._id;
            const likeIndex = post.likes.indexOf(userId);

            if (likeIndex === -1) {
                // Like the post
                post.likes.push(userId);
            } else {
                // Unlike the post
                post.likes.splice(likeIndex, 1);
            }

            await post.save();

            res.json({
                message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
                likeCount: post.likes.length
            });
        } catch (error) {
            res.status(400).json({
                error: 'Like/Unlike failed',
                details: error.message
            });
        }
    }

    // Search posts
    static async searchPosts(req, res) {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const posts = await CommunityPost.searchPosts(query);

            res.json({
                posts,
                totalResults: posts.length
            });
        } catch (error) {
            res.status(500).json({
                error: 'Search failed',
                details: error.message
            });
        }
    }

    // Get community statistics
    static async getCommunityStats(req, res) {
        try {
            const totalPosts = await CommunityPost.countDocuments();
            const totalUsers = await User.countDocuments();
            const categoryCounts = await CommunityPost.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);

            res.json({
                totalPosts,
                totalUsers,
                categoryCounts
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve community stats',
                details: error.message
            });
        }
    }

    // Community Budget Methods
    static async createCommunityBudget(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);
            
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const budgetData = {
                title: req.body.title,
                description: req.body.description,
                totalBudget: req.body.totalBudget,
                targetDate: req.body.targetDate,
                createdBy: req.user._id,
                contributions: [],
                contributors: [],
                currentFunds: 0,
                status: 'pending'
            };

            post.communityBudget = budgetData;
            await post.save();

            res.status(201).json({
                message: 'Community budget created successfully',
                budget: post.communityBudget
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to create community budget',
                details: error.message
            });
        }
    }

    static async contributeToBudget(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);
            
            if (!post || !post.communityBudget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            const contribution = {
                user: req.user._id,
                amount: req.body.amount
            };

            // Add contribution
            post.communityBudget.contributions.push(contribution);
            
            // Update current funds
            post.communityBudget.currentFunds += req.body.amount;
            
            // Add contributor if not already in list
            if (!post.communityBudget.contributors.includes(req.user._id)) {
                post.communityBudget.contributors.push(req.user._id);
            }

            // Check if budget is completed
            if (post.communityBudget.currentFunds >= post.communityBudget.totalBudget) {
                post.communityBudget.status = 'completed';
            }

            await post.save();

            res.status(200).json({
                message: 'Contribution added successfully',
                budget: post.communityBudget
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to contribute to budget',
                details: error.message
            });
        }
    }

    static async getCommunityBudget(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId)
                .populate('communityBudget.contributions.user', 'username profilePicture');
            
            if (!post || !post.communityBudget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            res.json(post.communityBudget);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve community budget',
                details: error.message
            });
        }
    }

    static async updateCommunityBudgetStatus(req, res) {
        try {
            const post = await CommunityPost.findById(req.params.postId);
            
            if (!post || !post.communityBudget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            // Only creator can update status
            if (post.communityBudget.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Unauthorized to update budget status' });
            }

            post.communityBudget.status = req.body.status;
            await post.save();

            res.json({
                message: 'Budget status updated successfully',
                budget: post.communityBudget
            });
        } catch (error) {
            res.status(400).json({
                error: 'Failed to update budget status',
                details: error.message
            });
        }
    }

    // Profile Management
    static async getProfile(req, res) {
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
    };

    static async updateProfile(req, res) {
        try {
            const allowedUpdates = [
                'bio', 'interests', 'preferences', 'profilePicture', 'coverPhoto'
            ];
            
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            const profile = await UserProfile.findOneAndUpdate(
                { user: req.user._id },
                { $set: updates },
                { new: true, runValidators: true }
            );

            res.json({ profile });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // Post Management
    static async createPost(req, res) {
        try {
            const post = new Post({
                author: req.user._id,
                content: req.body.content,
                topic: req.body.topic,
                category: req.body.category,
                tags: req.body.tags,
                media: req.body.media,
                visibility: req.body.visibility
            });

            await post.save();

            // Update user profile
            await UserProfile.findOneAndUpdate(
                { user: req.user._id },
                { 
                    $push: { posts: post._id },
                    $inc: { 'activity.totalPosts': 1 }
                }
            );

            res.status(201).json({ post });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    static async getFeed(req, res) {
        try {
            const userProfile = await UserProfile.findOne({ user: req.user._id });
            const following = userProfile.following;

            const posts = await Post.find({
                $or: [
                    { author: { $in: following }, visibility: 'public' },
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
    };

    // Interaction Management
    static async likePost(req, res) {
        try {
            const post = await Post.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const liked = await post.like(req.user._id);
            if (liked) {
                // Update author's reputation
                const authorProfile = await UserProfile.findOne({ user: post.author });
                await authorProfile.updateReputation(1);
            }

            res.json({ message: 'Post liked successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    static async unlikePost(req, res) {
        try {
            const post = await Post.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const unliked = await post.unlike(req.user._id);
            if (unliked) {
                // Update author's reputation
                const authorProfile = await UserProfile.findOne({ user: post.author });
                await authorProfile.updateReputation(-1);
            }

            res.json({ message: 'Post unliked successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // Comment Management
    static async addComment(req, res) {
        try {
            const post = await Post.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const comment = await post.addComment(req.user._id, req.body.content);

            // Update user activity
            await UserProfile.findOneAndUpdate(
                { user: req.user._id },
                { $inc: { 'activity.totalComments': 1 } }
            );

            // Update post author's reputation
            const authorProfile = await UserProfile.findOne({ user: post.author });
            await authorProfile.updateReputation(2);

            res.status(201).json({ comment });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // Expert Management
    static async verifyExpertise(req, res) {
        try {
            if (!req.userProfile.verificationStatus.isVerified) {
                return res.status(403).json({ error: 'Account verification required for expertise verification' });
            }

            const profile = await UserProfile.findOneAndUpdate(
                { user: req.params.userId },
                {
                    $push: {
                        expertise: {
                            area: req.body.area,
                            level: req.body.level,
                            verifiedAt: new Date(),
                            verifiedBy: req.user._id
                        }
                    }
                },
                { new: true }
            );

            if (req.body.level === 'expert') {
                await profile.addBadge('verified_professional', 
                    `Verified ${req.body.area} Expert`, 
                    `Recognized expert in ${req.body.area}`
                );
            }

            res.json({ profile });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // Community Insights
    static async getTopContributors(req, res) {
        try {
            const contributors = await UserProfile.getTopContributors(10);
            res.json({ contributors });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    static async getExpertsByArea(req, res) {
        try {
            const experts = await UserProfile.getExpertsByArea(req.params.area);
            res.json({ experts });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // Moderation
    static async moderatePost(req, res) {
        try {
            const post = await Post.findByIdAndUpdate(
                req.params.postId,
                {
                    status: req.body.status,
                    $push: {
                        moderationHistory: {
                            action: req.body.status,
                            moderator: req.user._id,
                            reason: req.body.reason,
                            timestamp: new Date()
                        }
                    }
                },
                { new: true }
            );

            if (req.body.status === 'removed') {
                // Update author's reputation
                const authorProfile = await UserProfile.findOne({ user: post.author });
                await authorProfile.updateReputation(-10);
                await authorProfile.updateActivity();
            }

            res.json({ post });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // Get all posts
    static async getPosts(req, res) {
        try {
            const posts = await Post.find()
                .sort({ createdAt: -1 })
                .populate('author', 'name avatar')
                .limit(20);
            res.json(posts);
        } catch (err) {
            console.error('Error getting posts:', err);
            res.status(500).json({ message: 'Failed to get posts' });
        }
    };

    // Create a new post
    static async createPost(req, res) {
        try {
            const { content, userId } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ message: 'Post content is required' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const post = new Post({
                content: content.trim(),
                author: userId,
                likes: 0,
                createdAt: new Date()
            });

            await post.save();
            
            // Populate author details before sending response
            await post.populate('author', 'name avatar');
            
            res.status(201).json(post);
        } catch (err) {
            console.error('Error creating post:', err);
            res.status(500).json({ message: 'Failed to create post' });
        }
    };

    // Like a post
    static async likePost(req, res) {
        try {
            const post = await Post.findById(req.params.postId);
            
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            post.likes = (post.likes || 0) + 1;
            await post.save();
            
            res.json({ likes: post.likes });
        } catch (err) {
            console.error('Error liking post:', err);
            res.status(500).json({ message: 'Failed to like post' });
        }
    };

    // Delete a post
    static async deletePost(req, res) {
        try {
            const post = await Post.findById(req.params.postId);
            
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Check if user is the author
            if (post.author.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this post' });
            }

            await post.remove();
            res.json({ message: 'Post deleted successfully' });
        } catch (err) {
            console.error('Error deleting post:', err);
            res.status(500).json({ message: 'Failed to delete post' });
        }
    };

}

module.exports = CommunityController;
