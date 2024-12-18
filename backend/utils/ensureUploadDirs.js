const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// Function to ensure upload directories exist
const ensureUploadDirectories = async () => {
    const uploadDirs = [
        path.join(__dirname, '../../uploads/receipts'),
        path.join(__dirname, '../../uploads/profile-pictures'),
        path.join(__dirname, '../../uploads/community')
    ];

    try {
        for (const dir of uploadDirs) {
            await fs.mkdir(dir, { recursive: true });
            logger.info(`Ensured upload directory exists: ${dir}`);
        }
    } catch (error) {
        logger.error('Error creating upload directories:', error);
        throw error;
    }
};

module.exports = ensureUploadDirectories;
