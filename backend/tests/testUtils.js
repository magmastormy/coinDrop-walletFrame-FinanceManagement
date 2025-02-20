const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const setupTestDB = async () => {
    try {
        // Use an in-memory MongoDB instance for testing
        const uri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/coinDrop_test';
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error('Test database connection error:', error);
        throw error;
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
