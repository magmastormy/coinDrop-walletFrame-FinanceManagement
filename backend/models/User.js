const logger = require('../utils/logger');

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { encrypt, decrypt } = require('../utils/encryption');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(email) {
                // Email format validation using regex
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return emailRegex.test(email);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(password) {
                // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        },
        select: false // Prevents password from being returned in queries
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: 'default-avatar.png'
    },
    phone: {
        type: String,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
        jti: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastLogin: {
        type: Date
    },
    resetPasswordAttempts: {
        type: Number,
        default: 0
    },
    resetPasswordLockUntil: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hash password and encrypt sensitive fields before saving
UserSchema.pre('save', async function(next) {
    // Ensure email is lowercase before saving
    if (this.isModified('email') && this.email) {
        this.email = this.email.toLowerCase();
    }

    // Only hash the password if it has been modified
    if (this.isModified('password')) {
        if (!this.password.startsWith('$2a$')) {
            try {
                // Generate a salt with higher rounds for better security
                const salt = await bcrypt.genSalt(12);
                
                // Hash the password
                this.password = await bcrypt.hash(this.password, salt);
            } catch (error) {
                return next(error);
            }
        }
    }

    // Encrypt sensitive fields if they've been modified
    if (this.isModified('phone') && this.phone) {
        this.phone = encrypt(this.phone);
    }

    next();
});

// Method to generate authentication token
UserSchema.methods.generateAuthToken = function() {
    const jti = crypto.randomUUID();
    const token = jwt.sign(
        { 
            userId: this._id, 
            role: this.role,
            jti
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: process.env.JWT_EXPIRATION || '1h' 
        }
    );

    // Add token to user's tokens array
    this.tokens = this.tokens.concat({ 
        token, 
        jti,
        createdAt: new Date()
    });
    return token;
};

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        logger.error('Password comparison error:', error);
        return false;
    }
};

// Method to check if account is locked
UserSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    // Otherwise increment or start at 1
    const updates = { $inc: { loginAttempts: 1 } };
    // Lock account after 5 failed attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minute lock
    }
    return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Method to return public profile
UserSchema.methods.toPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.tokens;
    // Replace encrypted phone with decrypted version
    if (userObject.phone) {
        userObject.phone = decrypt(userObject.phone);
    }
    return userObject;
};

// Virtual fields for decrypted sensitive data
UserSchema.virtual('decryptedEmail').get(function() {
    return this.email;
});

UserSchema.virtual('decryptedPhone').get(function() {
    return decrypt(this.phone);
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ lastLogin: -1 });

// Compound indexes for optimized queries
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ isVerified: 1, createdAt: -1 });

// Text index for search functionality
UserSchema.index({
    username: 'text',
    email: 'text',
    firstName: 'text',
    lastName: 'text'
}, {
    name: 'user_text_search',
    default_language: 'english',
    weights: {
        username: 10,
        email: 5,
        firstName: 3,
        lastName: 3
    }
});

// Sparse index for lastLogin (only for users who have logged in)
UserSchema.index({ lastLogin: 1 }, { sparse: true });

// ============================================
// Instance Methods
// ============================================

/**
 * Find users by role with pagination support
 * @param {string} role - The role to filter by
 * @param {Object} options - Query options (limit, skip, sort, etc.)
 * @returns {Promise<Array>} Array of user documents
 */
UserSchema.methods.findByRole = async function(role, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { createdAt: -1 },
        isVerified,
        searchTerm
    } = options;

    const query = { role };

    if (typeof isVerified === 'boolean') {
        query.isVerified = isVerified;
    }

    if (searchTerm) {
        query.$text = { $search: searchTerm };
    }

    return this.model('User')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-password -tokens')
        .lean();
};

/**
 * Search users across multiple fields
 * @param {string} query - The search query
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching user documents
 */
UserSchema.methods.searchUsers = async function(query, options = {}) {
    const {
        limit = 20,
        skip = 0,
        sort = { score: { $meta: 'textScore' } },
        role,
        isVerified
    } = options;

    const searchQuery = {
        $text: { $search: query }
    };

    if (role) searchQuery.role = role;
    if (typeof isVerified === 'boolean') searchQuery.isVerified = isVerified;

    return this.model('User')
        .find(searchQuery)
        .select('-password -tokens')
        .select({ score: { $meta: 'textScore' } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
};

// ============================================
// Static Methods
// ============================================

/**
 * Get comprehensive user statistics
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} User statistics object
 */
UserSchema.statics.getUserStats = async function(options = {}) {
    const { startDate, endDate, role } = options;

    const matchStage = {};

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    if (role) matchStage.role = role;

    // Total users count
    const totalUsers = await this.countDocuments(matchStage);

    // Users by role
    const usersByRole = await this.aggregate([
        { $match: matchStage },
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Users by verification status
    const usersByVerification = await this.aggregate([
        { $match: matchStage },
        { $group: { _id: '$isVerified', count: { $sum: 1 } } }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await this.countDocuments({
        ...matchStage,
        createdAt: { $gte: thirtyDaysAgo }
    });

    // Active users (logged in within last 30 days)
    const activeUsers = await this.countDocuments({
        ...matchStage,
        lastLogin: { $gte: thirtyDaysAgo }
    });

    // Daily registration trend (last 30 days)
    const dailyTrend = await this.aggregate([
        {
            $match: {
                ...matchStage,
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Users with profile pictures
    const usersWithProfilePicture = await this.countDocuments({
        ...matchStage,
        profilePicture: { $ne: 'default-avatar.png' }
    });

    return {
        summary: {
            totalUsers,
            recentRegistrations,
            activeUsers,
            usersWithProfilePicture,
            inactiveUsers: totalUsers - activeUsers
        },
        roleDistribution: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        verificationStatus: usersByVerification.reduce((acc, item) => {
            acc[item._id ? 'verified' : 'unverified'] = item.count;
            return acc;
        }, {}),
        dailyTrend: dailyTrend.map(day => ({
            date: day._id,
            count: day.count
        })),
        generatedAt: new Date()
    };
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
