const UserProfile = require('../models/UserProfile');
const { validationResult } = require('express-validator');

class ProfileController {
    // Get user profile
    static async getProfile(req, res) {
        try {
            console.log('Fetching profile for user:', req.params.userId);
            
            const profile = await UserProfile.findOne({ user: req.params.userId })
                .populate('user', 'username email profilePicture firstName lastName');
            
            if (!profile) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'Profile not found' 
                });
            }

            res.json({ 
                message: 'Profile retrieved successfully',
                profile 
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not retrieve profile'
            });
        }
    }
    
    // Update user profile
    static async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            const allowedUpdates = [
                'bio', 'interests', 'preferences', 
                'profilePicture', 'coverPhoto', 'phone'
            ];
            
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            const profile = await UserProfile.findOneAndUpdate(
                { user: req.params.userId },
                { $set: updates },
                { new: true, runValidators: true }
            ).populate('user', 'username email profilePicture firstName lastName');

            if (!profile) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'Profile not found'
                });
            }

            res.json({
                message: 'Profile updated successfully',
                profile
            });
        }
        catch (error) {
            console.error('Profile update error:', error);
            res.status(400).json({ 
                error: 'Update failed',
                details: error.message 
            });
        }
    }

    // Create user profile
    static async createProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            // Check if profile already exists
            const existingProfile = await UserProfile.findOne({ user: req.params.userId });
            if (existingProfile) {
                return res.status(400).json({
                    error: 'Profile exists',
                    details: 'User profile already exists'
                });
            }

            const profileData = {
                user: req.params.userId,
                bio: req.body.bio,
                interests: req.body.interests,
                phone: req.body.phone,
                profilePicture: req.body.profilePicture,
                coverPhoto: req.body.coverPhoto,
                preferences: req.body.preferences
            };

            const profile = await UserProfile.create(profileData);
            await profile.populate('user', 'username email profilePicture firstName lastName');
            res.status(201).json({
                message: 'Profile created successfully',
                profile
            });
        } catch (error) {
            console.error('Profile creation error:', error);
            res.status(400).json({ 
                error: 'Creation failed',
                details: error.message 
            });
        }
    }

    //delete profile
    static async deleteProfile(req, res) {
        try {
            console.log('Deleting profile for user:', req.params.userId);
            
            const profile = await UserProfile.findOneAndDelete({ user: req.params.userId });
            
            if (!profile) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'Profile not found' 
                });
            }

            // Clean up related data if needed
            // For example, remove profile from followers/following lists
            await UserProfile.updateMany(
                { followers: req.params.userId },
                { $pull: { followers: req.params.userId } }
            );

            await UserProfile.updateMany(
                { following: req.params.userId },
                { $pull: { following: req.params.userId } }
            );

            res.json({ 
                message: 'Profile deleted successfully',
                profile 
            });
        }
        catch (error) {
            console.error('Delete profile error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not delete profile'
            });
        }
    }

    static async getFollowing(req, res) {
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
    }

    static async getFollowers(req, res) {
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
    }
}

module.exports = ProfileController;