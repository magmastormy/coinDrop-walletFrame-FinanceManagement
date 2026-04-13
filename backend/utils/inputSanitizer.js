const logger = require('./logger');

/**
 * Input Sanitization Utility for AI Prompts
 * Prevents prompt injection attacks and malicious input
 */

/**
 * Sanitizes user input before inserting into AI prompts
 * Removes control characters, normalizes whitespace, prevents injection
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }

    // Remove null bytes and other control characters (except newlines/tabs)
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove Unicode control characters
    sanitized = sanitized.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
    
    // Normalize multiple whitespace to single space
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Trim excessive whitespace at boundaries
    sanitized = sanitized.trim();
    
    // Limit maximum length to prevent DoS
    const MAX_LENGTH = 4000;
    if (sanitized.length > MAX_LENGTH) {
        logger.warn(`[sanitizeInput] Input truncated from ${sanitized.length} to ${MAX_LENGTH} chars`);
        sanitized = sanitized.substring(0, MAX_LENGTH);
    }
    
    return sanitized;
}

/**
 * Detects potential prompt injection attempts
 * @param {string} input - User input to check
 * @returns {boolean} - True if injection pattern detected
 */
function detectInjectionAttempt(input) {
    const injectionPatterns = [
        // Attempt to override system instructions
        /\b(ignore\s+(previous|all|system|instructions?|rules?|guidelines?))\b/i,
        /\b(you\s+are\s+now|switch\s+to|become|act\s+as)\b/i,
        /\b(reveal|show|print|display|output)\s+(your|the)\s+(instructions?|prompt|system|rules?|guidelines?|configuration)\b/i,
        /\b(bypass|circumvent|ignore|disable)\s+(security|safety|content|filter|restriction)s?\b/i,
        
        // Attempt to access sensitive data
        /\b(show|list|display|reveal|extract)\s+(all\s+)?(users?|customers?|accounts?|passwords?|emails?)\b/i,
        /\b(database|db)\s+(query|select|extract|dump)\b/i,
        
        // Attempt to execute code
        /\b(execute|run|eval|interpret)\s+(code|script|command|function)\b/i,
        /\b(python|javascript|java|c\+\+|sql|bash|shell)\s+(code|script)\b/i,
        
        // Jailbreak attempts
        /\b(developer\s+mode|debug\s+mode|admin\s+mode|test\s+mode)\b/i,
        /\b(without\s+(restrictions?|limitations?|ethics?|morals?))\b/i,
        /\b(unfiltered|uncensored|unrestricted|nsfw)\b/i
    ];
    
    return injectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates message array structure and content
 * @param {Array} messages - Array of message objects
 * @returns {{valid: boolean, error?: string, sanitizedMessages?: Array}}
 */
function validateMessages(messages) {
    if (!Array.isArray(messages)) {
        return { valid: false, error: 'Messages must be an array' };
    }
    
    // Limit number of messages to prevent DoS
    const MAX_MESSAGES = 20;
    if (messages.length > MAX_MESSAGES) {
        return { 
            valid: false, 
            error: `Too many messages. Maximum allowed is ${MAX_MESSAGES}` 
        };
    }
    
    const sanitizedMessages = [];
    
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // Validate message structure
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: `Message ${i + 1} must be an object` };
        }
        
        if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
            return { valid: false, error: `Message ${i + 1} has invalid role` };
        }
        
        if (typeof msg.content !== 'string') {
            return { valid: false, error: `Message ${i + 1} content must be a string` };
        }
        
        // Limit individual message size
        const MAX_CONTENT_LENGTH = 4000;
        if (msg.content.length > MAX_CONTENT_LENGTH) {
            return { 
                valid: false, 
                error: `Message ${i + 1} exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` 
            };
        }
        
        // Sanitize content
        const sanitizedContent = sanitizeInput(msg.content);
        
        // Check for injection attempts in user messages
        if (msg.role === 'user' && detectInjectionAttempt(sanitizedContent)) {
            logger.warn(`[validateMessages] Injection attempt detected in message ${i + 1}`);
            return {
                valid: false,
                error: 'Invalid content detected'
            };
        }
        
        sanitizedMessages.push({
            role: msg.role,
            content: sanitizedContent
        });
    }
    
    return { valid: true, sanitizedMessages };
}

module.exports = {
    sanitizeInput,
    detectInjectionAttempt,
    validateMessages
};
