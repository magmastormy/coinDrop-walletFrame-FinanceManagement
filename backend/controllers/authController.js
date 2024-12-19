const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthController {
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
        try {
            // Check for validation errors
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

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });

            if (existingUser) {
                console.log("User already exists: ", existingUser);
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

            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);

            // Return success response
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token: accessToken,
                refreshToken
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Server error',
                details: 'Could not register user'
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

            // Find user by email and explicitly select password
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens using the static method
            const { accessToken, refreshToken } = AuthController.generateTokens(user._id, user.role);

            // Return success response
            res.json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token: accessToken,
                refreshToken
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
}

module.exports = AuthController;
