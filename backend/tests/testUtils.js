const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const setupTestDB = async () => {
    try {
        const uri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/coinDrop_test';
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 1500
        });
    } catch (error) {
        throw new Error(`Test database connection error: ${error.message}`);
    }
};

const generateAuthToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1d' }
    );
};

module.exports = {
    setupTestDB,
    generateAuthToken
};
