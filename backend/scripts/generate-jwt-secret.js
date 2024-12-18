const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random JWT secret
const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Path to .env file
const envPath = path.join(__dirname, '../.env');

// Generate and write JWT secret to .env file
const jwtSecret = generateJWTSecret();

// Read existing .env content
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    console.log('Creating new .env file');
}

// Remove existing JWT_SECRET if present
const cleanedContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('JWT_SECRET='))
    .join('\n');

// Append new JWT_SECRET
const updatedContent = `${cleanedContent}\nJWT_SECRET=${jwtSecret}`.trim() + '\n';

// Write updated content
fs.writeFileSync(envPath, updatedContent);

console.log('🔐 New JWT Secret Generated and Saved to .env');
console.log('🚨 IMPORTANT: Keep this secret confidential and do not share it!');
