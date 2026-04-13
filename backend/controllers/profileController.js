const logger = require('../utils/logger');

const cloudinary = require('cloudinary').v2; 
const UserProfile = require('../models/UserProfile');
const ImageService = require("../services/imageService");
const User = require("../models/User");
const { validationResult } = require('express-validator');
const { getAuthenticatedUserId } = require('../utils/authUser');
const isDev = process.env.NODE_ENV !== 'production';

const allowedInterests = [
    'investing',
    'budgeting',
    'saving',
    'crypto',
    'stocks',
    'real-estate',
    'retirement',
    'taxes',
    'insurance'
];

class ProfileController {
    
    // Get user profile
    static async getProfile(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);

            if (isDev) logger.debug('[Profile Controller] Fetching profile for user:', userId);
            
            const profile = await UserProfile.findOne({ user: userId })
                .populate('user', 'username email profilePicture firstName lastName');
            
            if (!profile) {
                // If no profile exists, create a new one
                if (isDev) logger.debug('[Profile Controller] No profile found, creating new profile...');
                const newProfile = await UserProfile.create({
                    user: userId,
                    username: req.user.username || `user_${userId}`,
                    interests: [],
                    activity: {
                        lastActive: new Date()
                    }
                });
                return res.status(201).json({ profile: newProfile });
            }

            res.json({ profile });
        } catch (error) {
            logger.error('[Profile Controller] Error fetching profile:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    static async updateProfile(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
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
                { user: userId },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!profile) {
                return res.status(404).json({ error: '[Profile Controller] Profile not found' });
            }

            res.json({ profile });
        } catch (error) {
            logger.error('[Profile Controller] Error updating profile:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Create user profile
    static async createProfile(req, res) {
        if (isDev) logger.debug(`[ProfileController: createProfile] Route utilized: /create-profile`);
        try {
            const userId = getAuthenticatedUserId(req);
            if (isDev) logger.debug('[Profile Controller: createProfile] Creating profile for user:', userId);
    
            // Check if profile already exists
            const existingProfile = await UserProfile.findOne({ user: userId });
            if (existingProfile) {
                if (isDev) logger.debug('[Profile Controller: createProfile] Profile already exists');
                return res.json({
                    message: '[Profile Controller: createProfile] Profile already exists',
                    profile: existingProfile
                });
            }
    
            // Get user data to ensure username exists
            const userData = await User.findById(userId);
            if (!userData) {
                return res.status(404).json({ error: '[Profile Controller: createProfile] User not found' });
            }
    
            const profileData = {
                user: userId,
                username: userData.username || `user_${userId}`,
                bio: req.body.bio || '',
                interests: req.body.interests || [],
                phone: req.body.phone || '',
                profilePicture: req.body.profilePicture || null,
                coverPhoto: req.body.coverPhoto || null,
                preferences: req.body.preferences || {}
            };
    
            if (isDev) logger.debug('[Profile Controller: createProfile] Creating new profile');
            const profile = await UserProfile.create(profileData);
            await profile.populate('user', 'username email profilePicture firstName lastName');
            
            if (isDev) logger.debug('[Profile Controller: createProfile] Profile created successfully');
            return res.status(201).json({
                message: '[Profile Controller: createProfile] Profile created successfully',
                profile
            });
        } catch (error) {
            logger.error('[Profile Controller: createProfile] Profile creation error:', error);
            return res.status(400).json({ 
                error: 'Creation failed',
                details: error.message 
            });
        }
    }

    //delete profile
    static async deleteProfile(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            if (isDev) logger.debug('[Profile Controller] Deleting profile for user:', userId);
            
            const profile = await UserProfile.findOneAndDelete({ user: userId });
            
            if (!profile) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: '[Profile Controller: deleteProfile] Profile not found'
                });
            }

            // Clean up related data if needed
            // For example, remove profile from followers/following lists
            await UserProfile.updateMany(
                { followers: userId },
                { $pull: { followers: userId } }
            );

            await UserProfile.updateMany(
                { following: userId },
                { $pull: { following: userId } }
            );

            res.json({ 
                message: '[Profile Controller: deleteProfile] Profile deleted successfully',
                profile 
            });
        }
        catch (error) {
            logger.error('[Profile Controller: deleteProfile] Delete profile error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not delete profile'
            });
        }
    }

    static async uploadProfileImage(req, res) {
        if (isDev) logger.debug('[ProfileController: uploadProfileImage] Method invoked');
        try {
            const userId = getAuthenticatedUserId(req);
            const imageType = req.query.type === 'cover' ? 'cover' : 'profile';

            if (isDev) logger.debug(`[ProfileController: uploadProfileImage] Route utilized: /upload-image?type=${imageType}`);

            let profile = await UserProfile.findOne({ user: userId });

            if (!profile) {
                if (isDev) logger.debug('[ProfileController: uploadImage] Creating new profile for user:', userId);
                profile = await UserProfile.create({
                    user: userId,
                    username: req.user.username || `user_${userId}`,
                    interests: [],
                    activity: { lastActive: new Date() }
                });
            }

            if (isDev) logger.debug('[ProfileController: uploadImage] Uploading image to Image Service');
            const result = await ImageService.uploadImage(req.file.path, {
                folder: `coinDrop_${imageType}`,
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            });
            if (isDev) logger.debug('[ProfileController: uploadImage] Image uploaded to Image Service');

            profile[imageType === 'cover' ? 'coverPhoto' : 'profilePicture'] = result.secure_url;
            await profile.save();

            return res.status(200).json({
                success: true,
                profile: {
                    ...profile.toObject(),
                    [imageType === 'cover' ? 'coverPhoto' : 'profilePicture']: result.secure_url
                },
                message: '[Profile Controller: uploadImage] Profile image uploaded successfully'
            });

        } catch (error) {
            logger.error('[Profile Controller: uploadImage] Profile image upload error:', error);
            return res.status(500).json({
                success: false,
                message: '[Profile Controller: uploadImage] Failed to upload profile image',
                error: error.message
            });
        }
    }

    static async deleteProfileImage(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const imageType = req.query.type === 'cover' ? 'cover' : 'profile';
            
            const profile = await UserProfile.findOne({ user: userId });
            if (!profile) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            const imageId = imageType === 'cover' ? 
                profile.coverPhoto : 
                profile.profilePicture;

            if (imageId) {
                await ImageService.deleteImage(imageId);
                
                // Update profile to remove image reference
                const updateField = imageType === 'cover' ? 'coverPhoto' : 'profilePicture';
                profile[updateField] = null;
                await profile.save();
            }

            res.json({ message: '[Profile Controller] Image deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getFollowing(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const profile = await UserProfile.findOne({ user: userId })
                .populate('following', 'username profilePicture');
            
            if (!profile) {
                return res.status(404).json({ error: '[Profile Controller] Profile not found' });
            }

            res.json({ following: profile.following });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getFollowers(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const profile = await UserProfile.findOne({ user: userId })
                .populate('followers', 'username profilePicture');
            
            if (!profile) {
                return res.status(404).json({ error: '[Profile Controller] Profile not found' });
            }

            res.json({ followers: profile.followers });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ProfileController;

