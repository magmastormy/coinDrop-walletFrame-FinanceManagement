/**
 * Authentication Controller
 * Handles user authentication, registration, login, token management, and profile operations
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Wallet = require('../models/Wallet');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');
require('dotenv').config();

class AuthController {
    /**
     * Get the JWT access secret from environment variables
     * @returns {string} JWT access secret
     */
    static getAccessSecret() {
        return process.env.JWT_SECRET;
    }

    /**
     * Get the JWT refresh secret from environment variables
     * @returns {string} JWT refresh secret
     */
    static getRefreshSecret() {
        return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    }

    /**
     * Normalize user token store to ensure it's an array
     * @param {Object} user - User object
     */
    static normalizeTokenStore(user) {
        if (!Array.isArray(user.tokens)) {
            user.tokens = [];
        }
    }

    /**
     * Add a refresh token to user's token store
     * @param {Object} user - User object
     * @param {string} refreshToken - Refresh token string
     */
    static addRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        try {
            // Decode the token to get the jti and expiration
            const decoded = jwt.decode(refreshToken);
            const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            user.tokens.push({ 
                token: refreshToken,
                jti: decoded?.jti || crypto.randomUUID(),
                expiresAt: expiresAt,
                createdAt: new Date()
            });
        } catch (error) {
            // If decoding fails, set default expiration
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            user.tokens.push({ 
                token: refreshToken,
                jti: crypto.randomUUID(),
                expiresAt: expiresAt,
                createdAt: new Date()
            });
        }
    }

    /**
     * Revoke a refresh token from user's token store
     * @param {Object} user - User object
     * @param {string} refreshToken - Refresh token string to revoke
     */
    static revokeRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        user.tokens = user.tokens.filter(item => item.token !== refreshToken);
    }

    /**
     * Clean expired tokens from user's token store
     * @param {Object} user - User object
     */
    static cleanExpiredTokens(user) {
        this.normalizeTokenStore(user);
        const now = new Date();
        user.tokens = user.tokens.filter(item => item.expiresAt && item.expiresAt > now);
    }

    /**
     * Check if user has a valid refresh token
     * @param {Object} user - User object
     * @param {string} refreshToken - Refresh token string to check
     * @returns {boolean} True if token exists and is valid
     */
    static hasRefreshToken(user, refreshToken) {
        this.normalizeTokenStore(user);
        this.cleanExpiredTokens(user);
        return user.tokens.some(item => item.token === refreshToken);
    }

    /**
     * Validate JWT token format
     * @param {string} token - JWT token string
     * @returns {boolean} True if token has valid format
     */
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

    /**
     * Generate access, refresh, and CSRF tokens
     * @param {string} userId - User ID
     * @param {string} role - User role
     * @returns {Object} Token object with accessToken, refreshToken, and csrfToken
     */
    static generateTokens(userId, role) {
        const accessToken = jwt.sign(
            { userId, role, jti: crypto.randomUUID() },
            this.getAccessSecret(),
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId, role, type: 'refresh', jti: crypto.randomUUID() },
            this.getRefreshSecret(),
            { expiresIn: '7d' }
        );

        const csrfToken = crypto.randomUUID();

        return { accessToken, refreshToken, csrfToken };
    }

    /**
     * Register a new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async register(req, res) {
        const ip = req.ip || req.connection.remoteAddress;
        logger.info('[REGISTRATION] Starting registration process...', {
            ip,
            userAgent: req.headers['user-agent']
        });
        
        // Don't use transactions unless we have a replica set
        const useTransaction = process.env.MONGODB_REPLICA_SET === 'true';
        logger.debug('[REGISTRATION] Transaction configuration', {
            useTransaction,
            replicaSet: process.env.MONGODB_REPLICA_SET
        });
        
        const session = useTransaction ? await mongoose.startSession() : null;
        
        if (session) {
            session.startTransaction();
            logger.debug('[REGISTRATION] Transaction started');
        } else {
            logger.debug('[REGISTRATION] Running without transaction (development mode)');
        }

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.warn('[REGISTRATION] Validation failed', {
                    errors: errors.array(),
                    ip
                });
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }
            logger.debug('[REGISTRATION] Validation passed');

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
                logger.warn('[REGISTRATION] User already exists', {
                    email: existingUser.email,
                    ip
                });
                if (session) {
                    await session.abortTransaction();
                    session.endSession();
                }
                return res.status(400).json({ 
                    error: 'User already exists',
                    details: existingUser.email === email 
                        ? 'Email is already registered' 
                        : 'Username is already taken'
                });
            }
            logger.debug('[REGISTRATION] No existing user found');

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

            logger.debug('[REGISTRATION] Saving user to database...');
            const savedUser = await user.save({ session });
            logger.info('[REGISTRATION] User saved successfully', {
                userId: savedUser._id.toString(),
                email: savedUser.email
            });

            logger.debug('[REGISTRATION] Creating user profile...');
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
            logger.debug('[REGISTRATION] Profile created');

            logger.debug('[REGISTRATION] Creating default wallet...');
            const defaultWallet = new Wallet({
                userId: savedUser._id,
                name: 'My First Wallet',
                type: 'cash',
                balance: 0,
                currency: 'USD',
                isActive: true
            });
            await defaultWallet.save({ session });
            logger.debug('[REGISTRATION] Wallet created');

            logger.debug('[REGISTRATION] Generating tokens...');
            const { accessToken, refreshToken, csrfToken } = AuthController.generateTokens(savedUser._id, savedUser.role);
            AuthController.addRefreshToken(savedUser, refreshToken);
            
            // Save without validating the password field (it's already hashed)
            await savedUser.save({ validateBeforeSave: false });
            logger.debug('[REGISTRATION] Tokens generated and saved');

            if (session) {
                logger.debug('[REGISTRATION] Committing transaction...');
                await session.commitTransaction();
                session.endSession();
                logger.debug('[REGISTRATION] Transaction committed');
            }

            logger.info('[REGISTRATION] Registration complete', {
                userId: savedUser._id.toString(),
                email: savedUser.email
            });
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
                refreshToken,
                csrfToken
            });

        } catch (error) {
            logger.error('[REGISTRATION] Error', {
                error: error.message,
                stack: error.stack,
                ip
            });
            
            if (session) {
                logger.error('[REGISTRATION] Aborting transaction...');
                await session.abortTransaction();
                session.endSession();
            }
            
            if (error.name === 'ValidationError') {
                logger.warn('[REGISTRATION] Mongoose validation error', {
                    error: error.message
                });
                const validationError = ErrorHandler.handleValidationError(error);
                return res.status(validationError.statusCode).json({
                    status: validationError.status,
                    message: validationError.message
                });
            }
            
            if (error.code === 11000) {
                logger.warn('[REGISTRATION] Duplicate key error', {
                    error: error.message
                });
                const duplicateError = ErrorHandler.handleDuplicateKeyError(error);
                return res.status(duplicateError.statusCode).json({
                    status: duplicateError.status,
                    message: duplicateError.message
                });
            }

            logger.error('[REGISTRATION] Unknown error', {
                error: error.message,
                stack: error.stack
            });
            const serverError = ErrorHandler.createError('Could not register user', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Login user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async login(req, res) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        logger.info('Login attempt started', {
            email: req.body?.email,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.warn('Login validation failed', {
                    email: req.body?.email,
                    ip,
                    errors: errors.array()
                });
                return res.status(400).json({ 
                    error: 'Validation failed',
                    details: errors.array() 
                });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                logger.warn('Login failed - User not found', {
                    email,
                    ip,
                    event: 'auth_failure'
                });
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            // Check if account is locked
            if (user.isLocked) {
                logger.warn('Login failed - Account locked', {
                    email: user.email,
                    userId: user._id,
                    ip,
                    event: 'account_locked'
                });
                return res.status(423).json({ 
                    error: 'Account locked',
                    details: 'Too many failed login attempts. Please try again later.'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                logger.warn('Login failed - Invalid password', {
                    email: user.email,
                    userId: user._id,
                    ip,
                    event: 'invalid_credentials'
                });
                // Increment login attempts
                await user.incrementLoginAttempts();
                return res.status(401).json({ 
                    error: 'Authentication failed',
                    details: 'Invalid email or password'
                });
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update lastLogin without triggering password validation
            user.lastLogin = new Date();
            const { accessToken, refreshToken, csrfToken } = AuthController.generateTokens(user._id, user.role);
            AuthController.cleanExpiredTokens(user);
            AuthController.addRefreshToken(user, refreshToken);
            
            // Save without validating the password field (it's already hashed)
            await user.save({ validateBeforeSave: false });

            logger.info('Login successful', {
                email: user.email,
                userId: user._id,
                role: user.role,
                ip,
                event: 'auth_success'
            });
            
            res.json({
                accessToken,
                refreshToken,
                csrfToken,
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
            logger.error('Login error', {
                email: req.body?.email,
                ip,
                error: error.message,
                stack: error.stack
            });
            const serverError = ErrorHandler.createError('Could not process login', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Refresh access token using refresh token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async refreshToken(req, res) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        logger.info('Token refresh attempt', {
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });
        
        try {
            // Get the refresh token from the request
            const refreshToken = req.body.refreshToken || 
                                (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            
            if (!refreshToken) {
                logger.warn('Token refresh failed - No token provided', {
                    ip,
                    event: 'refresh_token_missing'
                });
                return res.status(401).json({
                    error: 'Authentication failed',
                    details: 'No refresh token provided',
                    code: 'NO_TOKEN'
                });
            }

            // Validate token format before verification
            if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
                logger.warn('Token refresh failed - Invalid format', {
                    ip,
                    event: 'refresh_token_invalid_format'
                });
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
                    logger.warn('Token refresh failed - Invalid token type', {
                        ip,
                        event: 'refresh_token_invalid_type'
                    });
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Invalid token type',
                        code: 'INVALID_TOKEN_TYPE'
                    });
                }
                
                // Find the user
                const user = await User.findById(decoded.userId);
                
                if (!user) {
                    logger.warn('Token refresh failed - User not found', {
                        userId: decoded.userId,
                        ip,
                        event: 'refresh_token_user_not_found'
                    });
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                // Check if refresh token is in the user's valid tokens
                if (!AuthController.hasRefreshToken(user, refreshToken)) {
                    logger.warn('Token refresh failed - Invalid token', {
                        userId: user._id,
                        email: user.email,
                        ip,
                        event: 'refresh_token_invalid'
                    });
                    return res.status(401).json({
                        error: 'Authentication failed',
                        details: 'Invalid refresh token',
                        code: 'INVALID_TOKEN'
                    });
                }
                
                // Generate new tokens
                const { accessToken, refreshToken: newRefreshToken, csrfToken } = AuthController.generateTokens(user._id, user.role);
                
                // Update user's refresh tokens (remove old, add new)
                AuthController.revokeRefreshToken(user, refreshToken);
                AuthController.cleanExpiredTokens(user);
                AuthController.addRefreshToken(user, newRefreshToken);
                await user.save({ validateBeforeSave: false });
                
                logger.info('Token refresh successful', {
                    userId: user._id,
                    email: user.email,
                    ip,
                    event: 'refresh_token_success'
                });
                
                // Return new tokens
                res.json({
                    accessToken,
                    refreshToken: newRefreshToken,
                    csrfToken,
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
                    logger.warn('Token refresh failed - Invalid token', {
                        ip,
                        error: tokenError.message,
                        event: 'refresh_token_jwt_error'
                    });
                    const jwtError = ErrorHandler.handleJWTError();
                    return res.status(jwtError.statusCode).json({
                        status: jwtError.status,
                        message: jwtError.message,
                        code: 'INVALID_TOKEN'
                    });
                } else if (tokenError.name === 'TokenExpiredError') {
                    logger.warn('Token refresh failed - Token expired', {
                        ip,
                        event: 'refresh_token_expired'
                    });
                    const jwtExpiredError = ErrorHandler.handleJWTExpiredError();
                    return res.status(jwtExpiredError.statusCode).json({
                        status: jwtExpiredError.status,
                        message: jwtExpiredError.message,
                        code: 'TOKEN_EXPIRED'
                    });
                } else {
                    throw tokenError; // Re-throw unexpected errors
                }
            }
        } catch (error) {
            logger.error('Token refresh error', {
                ip,
                error: error.message,
                stack: error.stack
            });
            const serverError = ErrorHandler.createError('Failed to refresh token', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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
            logger.error('Get profile error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?._id
            });
            const serverError = ErrorHandler.createError('Could not retrieve user profile', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Logout user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async logout(req, res) {
        try {
            const refreshToken = req.body.refreshToken || 
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            if (refreshToken && req.user?.userId) {
                const user = await User.findById(req.user.userId);
                if (user) {
                    AuthController.revokeRefreshToken(user, refreshToken);
                    await user.save({ validateBeforeSave: false });
                }
            }
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error('Logout error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            const serverError = ErrorHandler.createError('Could not process logout', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Update user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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
            logger.error('Profile update error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            const serverError = ErrorHandler.createError('Could not update profile', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Change user password
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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
            await user.save({ validateBeforeSave: false });

            res.json({ 
                message: 'Password changed successfully' 
            });

        } catch (error) {
            logger.error('Password change error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            const serverError = ErrorHandler.createError('Could not change password', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Logout user from all devices
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async logoutAll(req, res) {
        try {
            if (req.user?.userId) {
                const user = await User.findById(req.user.userId);
                if (user) {
                    user.tokens = [];
                    await user.save({ validateBeforeSave: false });
                }
            }
            res.json({ 
                message: 'Logged out from all devices successfully' 
            });
        } catch (error) {
            logger.error('Logout all error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            const serverError = ErrorHandler.createError('Could not process logout from all devices', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Generate password reset token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async forgotPassword(req, res) {
        try {
            const { email, lastName } = req.body;

            // Find user by email and last name (for additional verification)
            const user = await User.findOne({ email, lastName });
            
            if (!user) {
                // Don't reveal if user exists or not for security
                return res.json({ 
                    message: 'If an account exists, you will receive password reset instructions'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Hash token and store in database
            user.resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            
            user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            await user.save({ validateBeforeSave: false });

            // In production, send email with reset link
            // For now, return the token (in development only)
            const isDev = process.env.NODE_ENV === 'development';
            
            logger.info('Password reset requested', {
                userId: user._id,
                email: user.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                message: 'Password reset instructions will be sent to your email',
                ...(isDev && {
                    resetToken,
                    resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
                })
            });

        } catch (error) {
            logger.error('Forgot password error', { error: error.message });
            const serverError = ErrorHandler.createError('Could not process password reset request', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Reset password using reset token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    static async resetPassword(req, res) {
        try {
            const { token, newPassword, confirmPassword } = req.body;

            if (!token || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    details: 'Token, new password, and confirmation are required'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    error: 'Passwords do not match'
                });
            }

            // Hash the token to compare with stored hash
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Find user with valid reset token
            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: new Date() } // Token not expired
            });

            if (!user) {
                return res.status(400).json({
                    error: 'Invalid or expired reset token'
                });
            }

            // Validate password strength
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    error: 'Weak password',
                    details: 'Password must include uppercase, lowercase, number, and special character'
                });
            }

            // Set new password
            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            logger.info('Password reset successful', {
                userId: user._id,
                timestamp: new Date().toISOString()
            });

            res.json({
                message: 'Password reset successfully'
            });

        } catch (error) {
            logger.error('Reset password error', { error: error.message });
            const serverError = ErrorHandler.createError('Could not reset password', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }

    /**
     * Delete user account
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
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
            logger.error('Delete account error', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            const serverError = ErrorHandler.createError('Could not delete account', 500);
            return res.status(serverError.statusCode).json({
                status: serverError.status,
                message: serverError.message
            });
        }
    }
}

module.exports = AuthController;
