//utils.generateToken.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class TokenUtils {
    // Generate a secure random token
    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate JWT token
    static generateJWTToken(payload, expiresIn = '1h') {
        return jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );
    }

    // Generate verification token
    static generateVerificationToken() {
        return this.generateSecureToken(16);
    }

    // Generate reset password token
    static generateResetPasswordToken() {
        return {
            token: this.generateSecureToken(16),
            expires: Date.now() + 3600000 // 1 hour from now
        };
    }

    // Verify JWT token
    static verifyJWTToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    // Decode JWT token without verification
    static decodeJWTToken(token) {
        return jwt.decode(token);
    }
}

module.exports = TokenUtils;