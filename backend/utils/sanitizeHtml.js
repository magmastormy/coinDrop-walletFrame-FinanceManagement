/**
 * HTML Sanitization Utility
 * Uses the sanitize-html library which is a robust, well-maintained solution
 * for preventing XSS attacks by allowing only safe HTML elements and attributes.
 */

const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML input to prevent XSS
 * Uses a strict whitelist approach - only allows explicitly safe elements/attributes
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string safe for HTML output
 */
function sanitizeHtmlSafe(input = '') {
    if (typeof input !== 'string') {
        return String(input);
    }
    
    // Configure sanitize-html with strict settings
    return sanitizeHtml(input, {
        // Only allow these specific tags
        allowedTags: [
            'b', 'i', 'em', 'strong', 'u', 's', 'strike',
            'p', 'br', 'div', 'span',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'a', 'img'
        ],
        // Only allow these attributes on allowed tags
        allowedAttributes: {
            'a': ['href', 'title', 'target', 'rel'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
            'div': ['class'],
            'span': ['class'],
            'p': ['class'],
            'blockquote': ['class'],
            'code': ['class'],
            'pre': ['class'],
            '*': ['class'] // Allow class on all elements
        },
        // Allowed URL schemes for href/src
        allowedSchemes: ['http', 'https', 'mailto'],
        // Ensure links open in new tab
        allowedSchemesByTag: {
            'a': ['http', 'https', 'mailto'],
            'img': ['http', 'https', 'data']
        },
        // Strip all event handlers
        allowedAttributes: {
            '*': ['class'] // Only class attribute allowed globally
        },
        // Transform disallowed tags instead of removing (optional)
        // selfClosing: ['br', 'hr', 'img', 'input', 'link', 'meta'],
        // Don't allow data: URIs except for images
        allowedIframeHostnames: [], // No iframes allowed
        // Enforce single text nodes
        textFilter: function(text) {
            return text;
        }
    });
}

/**
 * Sanitize input for general use (not HTML output)
 * Strips HTML tags completely and normalizes whitespace
 * @param {string|any} input - Input to sanitize
 * @returns {string|any} - Sanitized input
 */
function sanitizeInput(input) {
    if (input === null || input === undefined) {
        return input;
    }
    
    if (typeof input === 'string') {
        // Strip all HTML tags completely, then normalize whitespace
        const sanitized = sanitizeHtml(input, {
            allowedTags: [],
            allowedAttributes: {}
        });
        
        return sanitized
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
    }
    
    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }
    
    if (typeof input === 'object') {
        const sanitized = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                sanitized[key] = sanitizeInput(input[key]);
            }
        }
        return sanitized;
    }
    
    return input;
}

module.exports = {
    sanitizeHtml: sanitizeHtmlSafe,
    sanitizeInput
};