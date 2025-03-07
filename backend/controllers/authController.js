const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Category = require('../models/Category');
const SavingsAccount = require('../models/SavingsAccount');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthController {

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
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId, role, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }

    // User Registration
    static async register(req, res) {
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log('📝 Registration request received:', req.body);
            
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('❌ Validation errors:', errors.array());
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

            // Check for existing user before any database operations
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

            console.log('✅ No existing user found, creating new user...');

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

            // Create user profile
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
            console.log('✅ User profile created successfully');

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            const { accessToken, refreshToken } = AuthController.generateTokens(savedUser._id, savedUser.role);
            console.log('✅ Tokens generated successfully');

            // Return success response
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
                token: accessToken,
                refreshToken
            });

        } catch (error) {
            // Rollback transaction on error
            await session.abortTransaction();
            session.endSession();
            
            console.error('❌ Registration error:', error);
            console.error('Error stack:', error.stack);
            
            // Check for specific MongoDB errors
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

            console.log("AuthController.login - Request:", { email, password });

            // Find user by email and explicitly select password
            const user = await User.findOne({ email }).select('+password');
            
            console.log("AuthController.login - User found:", { 
                found: !!user,
                userId: user?._id,
                email: user?.email,
                passwordHash: user?.password 
            });

            if (!user) {
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            // Add password normalization for existing seeded users
            const isLegacyPassword = user.password.startsWith('$2a$10$hVNyxBKkgZv8EeNHz.r0ku');
            const isValidPassword = await bcrypt.compare(password, user.password);

            console.log("AuthController.login - Password check:", {
                isLegacyPassword,
                isValidPassword,
                passwordMatch: user.password === password,
                bcryptMatch: await bcrypt.compare(password, user.password)
            });

            if (!isValidPassword) {
                // Auto-upgrade legacy passwords
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

            console.log("AuthController.login - User authenticated:", { 
                userId: user._id,
                email: user.email,
                role: user.role
            });

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens using the static method
            const { accessToken, refreshToken } = AuthController.generateTokens(user._id, user.role);

            // Return success response
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
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            // Check if it's a refresh token
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Find user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new tokens
            const tokens = this.generateTokens(user._id, user.role);

            res.json({
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({ 
                error: 'Invalid refresh token',
                details: error.message 
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

            const user = await User.findById(req.user.userId);
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
        try {
            const { email, lastName, newPassword } = req.body;
            
            const user = await User.findOne({ 
                email: email.toLowerCase(),
                lastName: lastName.trim() 
            });
            
            if (!user) {
                return res.status(404).json({ 
                    error: 'No account found with this email and last name combination' 
                });
            }

            // Hash new password (using same method as changePassword)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            user.password = hashedPassword;
            user.updatedAt = new Date();
            await user.save();

            res.json({ message: 'Password has been reset successfully' });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not reset password'
            });
        }
    }

}

module.exports = AuthController;
