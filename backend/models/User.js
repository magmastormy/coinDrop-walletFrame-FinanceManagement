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
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hash password and encrypt sensitive fields before saving
UserSchema.pre('save', async function(next) {
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
    const token = jwt.sign(
        { 
            userId: this._id, 
            role: this.role,
            jti: crypto.randomUUID() 
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: process.env.JWT_EXPIRATION || '1h' 
        }
    );

    // Add token to user's tokens array
    this.tokens = this.tokens.concat({ 
        token, 
        jti: crypto.randomUUID(),
        createdAt: new Date()
    });
    return token;
};

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
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

const User = mongoose.model('User', UserSchema);

module.exports = User;
