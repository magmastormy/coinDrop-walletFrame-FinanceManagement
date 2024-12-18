const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        transactions: {
            type: Boolean,
            default: true
        },
        budgetAlerts: {
            type: Boolean,
            default: true
        },
        communityUpdates: {
            type: Boolean,
            default: true
        }
    },
    preferences: {
        language: {
            type: String,
            enum: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
            default: 'English'
        },
        theme: {
            type: String,
            enum: ['Light', 'Dark', 'System'],
            default: 'Light'
        },
        defaultCurrency: {
            type: String,
            default: 'USD'
        }
    },
});

// Create default settings for new user
UserSettingsSchema.statics.createDefaultSettings = async function(userId) {
    const settings = new this({
        userId,
        notifications: {
            email: true,
            push: true,
            transactions: true,
            budgetAlerts: true,
            communityUpdates: true
        },
        preferences: {
            language: 'English',
            theme: 'Light',
            defaultCurrency: 'USD'
        },
    });
    return settings.save();
};

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
