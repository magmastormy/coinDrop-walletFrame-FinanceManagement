const logger = require('./logger');

const crypto = require('crypto');

// Validate ENCRYPTION_KEY exists and is properly formatted
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required. Generate a 64-character hex key (32 bytes).');
}

if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 characters (32 bytes in hex format)');
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Encrypts a string value using AES-256-CBC
 * @param {string|number|object} data - Data to encrypt (will be converted to string)
 * @returns {string|null} - Encrypted data in format "iv:encryptedData" or null if input is null/undefined
 */
function encrypt(data) {
    if (data === null || data === undefined) {
        return null;
    }

    // Convert to string if not already
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    if (text === '') {
        return '';
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Return format: "iv:encryptedData"
        return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
        logger.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts an encrypted string
 * @param {string|null} encryptedData - Encrypted data in format "iv:encryptedData"
 * @returns {string|null} - Decrypted data or null if input is null/undefined
 */
function decrypt(encryptedData) {
    if (encryptedData === null || encryptedData === undefined) {
        return null;
    }

    if (encryptedData === '') {
        return '';
    }

    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const encryptedText = parts[1];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        logger.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

module.exports = {
    encrypt,
    decrypt
};
