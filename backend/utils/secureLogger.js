const logger = require('./logger');

/**
 * Secure Logger Utility
 * Prevents sensitive data leakage in logs
 */

const SENSITIVE_FIELDS = [
    'password', 'newPassword', 'currentPassword',
    'token', 'accessToken', 'refreshToken', 'csrfToken',
    'apiKey', 'apiSecret', 'encryptionKey',
    'creditCard', 'cardNumber', 'cvv', 'ssn',
    'bankAccount', 'routingNumber'
];

const REDACTED_VALUE = '[REDACTED]';

/**
 * Deep clone and sanitize an object
 * @param {any} obj - Object to sanitize
 * @param {Set} visited - Track visited objects to prevent circular refs
 * @returns {any} - Sanitized copy
 */
function sanitizeObject(obj, visited = new Set()) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle circular references
    if (visited.has(obj)) {
        return '[Circular Reference]';
    }
    visited.add(obj);
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, visited));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        
        // Check if this is a sensitive field
        if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
            sanitized[key] = REDACTED_VALUE;
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value, visited);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Logger class with automatic PII redaction
 */
class SecureLogger {
    constructor(prefix = '') {
        this.prefix = prefix;
    }
    
    /**
     * Log info message (safe for production)
     */
    info(message, data = {}) {
        const safeData = sanitizeObject(data);
        logger.debug(JSON.stringify({
            level: 'info',
            timestamp: new Date().toISOString(),
            prefix: this.prefix,
            message,
            ...safeData
        }));
    }
    
    /**
     * Log warning message
     */
    warn(message, data = {}) {
        const safeData = sanitizeObject(data);
        logger.warn(JSON.stringify({
            level: 'warn',
            timestamp: new Date().toISOString(),
            prefix: this.prefix,
            message,
            ...safeData
        }));
    }
    
    /**
     * Log error message
     */
    error(message, error = {}) {
        const safeError = {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            ...sanitizeObject(error)
        };
        
        logger.error(JSON.stringify({
            level: 'error',
            timestamp: new Date().toISOString(),
            prefix: this.prefix,
            message,
            ...safeError
        }));
    }
    
    /**
     * Debug logging (only in development)
     */
    debug(message, data = {}) {
        if (process.env.NODE_ENV !== 'development') {
            return;
        }
        
        const safeData = sanitizeObject(data);
        console.debug(JSON.stringify({
            level: 'debug',
            timestamp: new Date().toISOString(),
            prefix: this.prefix,
            message,
            ...safeData
        }));
    }
    
    /**
     * Log financial data safely
     */
    financial(action, data = {}) {
        const safeData = sanitizeObject(data);
        this.info(`[FINANCIAL] ${action}`, safeData);
    }
}

/**
 * Create a secure logger instance
 * @param {string} prefix - Prefix for log messages
 * @returns {SecureLogger}
 */
function createLogger(prefix) {
    return new SecureLogger(prefix);
}

module.exports = {
    createLogger,
    sanitizeObject,
    SENSITIVE_FIELDS
};
