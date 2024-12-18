const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

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
        }
    }],
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified
    if (!this.isModified('password')) return next();

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        
        // Hash the password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to generate authentication token
UserSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { 
            userId: this._id, 
            role: this.role 
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: process.env.JWT_EXPIRATION || '1h' 
        }
    );

    // Add token to user's tokens array
    this.tokens = this.tokens.concat({ token });
    return token;
};

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Candidate Password:', candidatePassword);
        console.log('Stored Hash:', this.password);
        
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        
        console.log('Is Password Match:', isMatch);
        
        // If not matching, try re-hashing the candidate password
        const hashedAttempt = await bcrypt.hash(candidatePassword, 10);
        console.log('Re-hashed Candidate:', hashedAttempt);
        
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Method to return public profile
UserSchema.methods.toPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
