const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthController {
    static getAccessSecret() {
        return process.env.JWT_SECRET;
    }

    static getRefreshSecret() {
        return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    }

    static normalizeTokenStore(user) {
        if (!Array.isArray(user.tokens)) {
            user.tokens = [];
        }
    }

    static addRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        user.tokens.push({ token: refreshToken });
    }

    static revokeRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        user.tokens = user.tokens.filter(item => item.token !== refreshToken);
    }

    static hasRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        return user.tokens.some(item => item.token === refreshToken);
    }

    // Helper to validate token format
    static isValidJWT = (token) => {
        if (!token) return false;
        try {
        // Check token has 3 parts (header.payload.signature)
            const parts = token.split('.');
            return parts.length === 3;
        } catch (err) {
            return false;
        }
    };
    static generateTokens(userId, role) {
        const accessToken = jwt.sign(
            { userId, role },
            this.getAccessSecret(),
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId, role, type: 'refresh' },
            this.getRefreshSecret(),
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }

    // User Registration
    static async register(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            const { 
                username, 
                email, 
                password, 
                firstName, 
                lastName,
                phone 
            } = req.body;

            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            }).session(session);

            if (existingUser) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    error: 'User already exists',
                    details: existingUser.email === email 
                        ? 'Email is already registered' 
                        : 'Username is already taken'
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password, //will be hashed by the pre-save hook
                firstName,
                lastName,
                phone,
                role: 'user',
                createdAt: new Date(),
                lastLogin: new Date()
            });

            const savedUser = await user.save({ session });

            const userProfile = new UserProfile({
                user: savedUser._id,
                username: savedUser.username,
                bio: '',
                location: '',
                interests: [],
                expertise: [],
                communityRole: 'member',
                reputation: 0,
                badges: [],
                createdAt: new Date()
            });
            await userProfile.save({ session });

            const { accessToken, refreshToken } = AuthController.generateTokens(savedUser._id, savedUser.role);
            AuthController.addRefreshToken(savedUser, refreshToken);
            await savedUser.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: savedUser._id,
                    username: savedUser.username,
                    email: savedUser.email,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    role: savedUser.role
                },
                accessToken,
                refreshToken
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            
            console.error('❌ Registration error:', error);
            console.error('Error stack:', error.stack);
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    error: 'Validation error',
                    details: Object.values(error.errors).map(err => err.message)
                });
            }
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(400).json({
                    error: 'Duplicate field error',
                    details: `${field} already exists`
                });
            }

            res.status(500).json({ 
                error: 'Server error',
                details: process.env.NODE_ENV === 'development' 
                    ? error.message 
                    : 'Could not register user'
            });
        }
    }

    // User Login
    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                if (user.password === password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                    await user.save();
                } else {
                    return res.status(401).json({ 
                        error: 'Authentication failed',
                        details: 'Invalid email or password'
                    });
                }
            }

            user.lastLogin = new Date();
            const { accessToken, refreshToken } = AuthController.generateTokens(user._id, user.role);
            AuthController.addRefreshToken(user, refreshToken);
            await user.save();

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    username: user.username
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not process login'
            });
        }
    }

    // Refresh Token
    static async refreshToken(req, res) {
        try {
            // Get the refresh token from the request
            const refreshToken = req.body.refreshToken || 
                                (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            
            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    details: 'No refresh token provided',
                    code: 'NO_TOKEN'
                });
            }

            // Validate token format before verification
            if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    details: 'Invalid token format',
                    code: 'INVALID_FORMAT'
                });
            }

            try {
                // Verify the token
                const decoded = jwt.verify(refreshToken, AuthController.getRefreshSecret());
                if (decoded.type !== 'refresh') {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Invalid token type',
                        code: 'INVALID_TOKEN_TYPE'
                    });
                }
                
                // Find the user
                const user = await User.findById(decoded.userId);
                
                if (!user) {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                // Check if refresh token is in the user's valid tokens
                if (!AuthController.hasRefreshToken(user, refreshToken)) {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Invalid refresh token',
                        code: 'INVALID_TOKEN'
                    });
                }
                
                // Generate new tokens
                const { accessToken, refreshToken: newRefreshToken } = AuthController.generateTokens(user._id, user.role);
                
                // Update user's refresh tokens (remove old, add new)
                AuthController.revokeRefreshToken(user, refreshToken);
                AuthController.addRefreshToken(user, newRefreshToken);
                await user.save();
                
                // Return new tokens
                res.json({
                    accessToken,
                    refreshToken: newRefreshToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        username: user.username
                    }
                });
            } catch (tokenError) {
                // Handle specific JWT errors
                if (tokenError.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Invalid token',
                        code: 'INVALID_TOKEN'
                    });
                } else if (tokenError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Token expired',
                        code: 'TOKEN_EXPIRED'
                    });
                } else {
                    throw tokenError; // Re-throw unexpected errors
                }
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                error: 'Server error',
                details: 'Failed to refresh token',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Get User Profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not retrieve user profile'
            });
        }
    }

    // Logout User
    static async logout(req, res) {
        try {
            const refreshToken = req.body.refreshToken || 
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            if (refreshToken && req.user?.userId) {
                const user = await User.findById(req.user.userId);
                if (user) {
                    AuthController.revokeRefreshToken(user, refreshToken);
                    await user.save();
                }
            }
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not process logout'
            });
        }
    }

    // Update User Profile
    static async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            const updates = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                updatedAt: new Date()
            };

            const user = await User.findByIdAndUpdate(
                req.user.userId,
                { $set: updates },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'User not found'
                });
            }

            res.json({
                message: 'Profile updated successfully',
                user
            });

        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not update profile'
            });
        }
    }

    // Change Password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            const user = await User.findById(req.user.userId).select('+password');
            if (!user) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'User not found'
                });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Current password is incorrect'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password
            user.password = hashedPassword;
            user.updatedAt = new Date();
            await user.save();

            res.json({ 
                message: 'Password changed successfully' 
            });

        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not change password'
            });
        }
    }

    // Logout from all devices
    static async logoutAll(req, res) {
        try {
            if (req.user?.userId) {
                const user = await User.findById(req.user.userId);
                if (user) {
                    user.tokens = [];
                    await user.save();
                }
            }
            res.json({ 
                message: 'Logged out from all devices successfully' 
            });
        } catch (error) {
            console.error('Logout all error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not process logout from all devices'
            });
        }
    }

    static async deleteAccount(req, res) {
        try {
            const user = await User.findByIdAndDelete(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    error: 'Not found',
                    details: 'User not found'
                });
            }
            res.json({
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                error: 'Server error',
                details: 'Could not delete account'
            });
        }
    }

    static async forgotPassword(req, res) {
        return res.status(410).json({
            error: 'Password reset temporarily disabled',
            details: 'This endpoint is disabled until a secure token-based reset flow is implemented.'
        });
    }

}

module.exports = AuthController;
