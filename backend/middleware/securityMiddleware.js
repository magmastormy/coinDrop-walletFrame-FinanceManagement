/**
 * Security Middleware
 * Comprehensive security middleware for authentication, authorization, and protection
 */
const crypto = require('crypto');
const logger = require('../utils/logger');
const { AuthorizationError, ValidationError } = require('../utils/errorClasses');
const AuditLog = require('../models/AuditLog');

// ============================================
// In-Memory Stores (Use Redis in production)
// ============================================

// CSRF token store
const csrfTokenStore = new Map();

// Request pattern tracking for suspicious activity detection
const requestPatterns = new Map();

// Suspicious IP tracking
const suspiciousIps = new Map();
const blockedIps = new Set();

// ============================================
// Admin Role Middleware
// ============================================

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const adminRoleMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    try {
        // Check if user exists on request
        if (!req.user) {
            logger.warnWithMetadata('Admin access denied: No user found', {
                requestId,
                clientIp,
                path: req.path,
                method: req.method
            });
            throw new AuthorizationError('Authentication required');
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            logger.warnWithMetadata('Admin access denied: User is not admin', {
                requestId,
                clientIp,
                userId: req.user._id || req.user.userId,
                userRole: req.user.role,
                path: req.path,
                method: req.method
            });
            throw new AuthorizationError('Admin access required');
        }

        logger.debugWithMetadata('Admin access granted', {
            requestId,
            clientIp,
            userId: req.user._id || req.user.userId,
            path: req.path
        });

        next();
    } catch (error) {
        next(error);
    }
};

// ============================================
// Request Sanitization Middleware
// ============================================

/**
 * Escape special HTML characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeHtml = (str) => {
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
};

/**
 * Remove HTML tags from string
 * @param {string} str - String to sanitize
 * @returns {string} String without HTML tags
 */
const removeHtmlTags = (str) => {
    return str.replace(/<[^>]*>/g, '');
};

/**
 * Recursively sanitize an object
 * @param {*} value - Value to sanitize
 * @param {Set} visited - Set of visited objects (for circular reference protection)
 * @returns {*} Sanitized value
 */
const sanitizeValue = (value, visited = new Set()) => {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return value;
    }

    // Handle strings
    if (typeof value === 'string') {
        let sanitized = removeHtmlTags(value);
        sanitized = sanitized.trim();
        sanitized = escapeHtml(sanitized);
        return sanitized;
    }

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item, visited));
    }

    // Handle objects
    if (typeof value === 'object') {
        // Prevent circular references
        if (visited.has(value)) {
            return '[Circular]';
        }
        visited.add(value);

        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeValue(val, visited);
        }
        visited.delete(value);
        return sanitized;
    }

    // Return other types as-is (numbers, booleans, etc.)
    return value;
};

/**
 * Middleware to sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const requestSanitization = (req, res, next) => {
    const requestId = req.requestId || 'unknown';

    try {
        if (req.body && typeof req.body === 'object') {
            const originalBody = JSON.stringify(req.body);
            req.body = sanitizeValue(req.body);
            const sanitizedBody = JSON.stringify(req.body);

            // Log if sanitization changed anything
            if (originalBody !== sanitizedBody) {
                logger.infoWithMetadata('Request body sanitized', {
                    requestId,
                    path: req.path,
                    method: req.method
                });
            }
        }

        // Also sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeValue(req.query);
        }

        next();
    } catch (error) {
        logger.errorWithMetadata('Request sanitization error', {
            requestId,
            error: error.message
        });
        next(error);
    }
};

// ============================================
// CSRF Protection Middleware
// ============================================

/**
 * Generate a new CSRF token
 * @param {string} sessionId - Session identifier
 * @returns {string} Generated CSRF token
 */
const generateCsrfToken = (sessionId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    csrfTokenStore.set(sessionId, {
        token,
        expiresAt
    });

    return token;
};

/**
 * Validate CSRF token
 * @param {string} sessionId - Session identifier
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid
 */
const validateCsrfToken = (sessionId, token) => {
    const stored = csrfTokenStore.get(sessionId);

    if (!stored) {
        return false;
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
        csrfTokenStore.delete(sessionId);
        return false;
    }

    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(stored.token, 'hex'),
            Buffer.from(token, 'hex')
        );
    } catch {
        return false;
    }
};

/**
 * Middleware for CSRF protection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const csrfProtection = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Skip CSRF for GET requests (they should be safe)
    if (req.method === 'GET') {
        return next();
    }

    // Skip in development mode if configured
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
        logger.debugWithMetadata('CSRF check skipped in development', {
            requestId,
            path: req.path
        });
        return next();
    }

    try {
        // Get session ID from cookie or header
        const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

        if (!sessionId) {
            logger.warnWithMetadata('CSRF validation failed: No session ID', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new ValidationError('Session required');
        }

        // Get CSRF token from header
        const csrfToken = req.headers['x-csrf-token'];

        if (!csrfToken) {
            logger.warnWithMetadata('CSRF validation failed: No CSRF token', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new ValidationError('CSRF token required');
        }

        // Validate token
        if (!validateCsrfToken(sessionId, csrfToken)) {
            logger.warnWithMetadata('CSRF validation failed: Invalid token', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new ValidationError('Invalid CSRF token');
        }

        logger.debugWithMetadata('CSRF validation successful', {
            requestId,
            clientIp,
            path: req.path
        });

        next();
    } catch (error) {
        next(error);
    }
};

// ============================================
// Request Signing Middleware
// ============================================

/**
 * Calculate body hash
 * @param {Object} body - Request body
 * @returns {string} SHA256 hash of body
 */
const calculateBodyHash = (body) => {
    if (!body || Object.keys(body).length === 0) {
        return '';
    }
    const bodyString = JSON.stringify(body);
    return crypto.createHash('sha256').update(bodyString).digest('hex');
};

/**
 * Verify request signature
 * @param {string} signature - Provided signature
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {string} timestamp - Timestamp
 * @param {string} bodyHash - Body hash
 * @returns {boolean} True if valid
 */
const verifyRequestSignature = (signature, method, path, timestamp, bodyHash) => {
    const secret = process.env.REQUEST_SIGNING_SECRET;

    if (!secret) {
        logger.errorWithMetadata('Request signing secret not configured');
        return false;
    }

    // Check timestamp is within 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > fiveMinutes) {
        return false;
    }

    // Construct signature payload
    const payload = `${method}:${path}:${timestamp}:${bodyHash}`;

    // Calculate expected signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
};

/**
 * Middleware for request signing verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const requestSigning = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Skip if request signing is not required for this route
    // In production, you might want to configure this per-route
    if (process.env.REQUIRE_REQUEST_SIGNING !== 'true') {
        return next();
    }

    try {
        const signature = req.headers['x-request-signature'];
        const timestamp = req.headers['x-request-timestamp'];

        if (!signature) {
            logger.warnWithMetadata('Request signing failed: No signature', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new AuthorizationError('Request signature required');
        }

        if (!timestamp) {
            logger.warnWithMetadata('Request signing failed: No timestamp', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new AuthorizationError('Request timestamp required');
        }

        const bodyHash = calculateBodyHash(req.body);

        if (!verifyRequestSignature(signature, req.method, req.path, timestamp, bodyHash)) {
            logger.warnWithMetadata('Request signing failed: Invalid signature', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new AuthorizationError('Invalid request signature');
        }

        logger.debugWithMetadata('Request signature verified', {
            requestId,
            clientIp,
            path: req.path
        });

        next();
    } catch (error) {
        next(error);
    }
};

// ============================================
// Audit Log Middleware
// ============================================

/**
 * Middleware to log admin actions for audit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const auditLogMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Only log for admin users
    if (!req.user || req.user.role !== 'admin') {
        return next();
    }

    // State-changing operations
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    // Capture response data
    const originalSend = res.send.bind(res);
    let responseStatus = 200;

    res.send = function(data) {
        responseStatus = res.statusCode;
        return originalSend(data);
    };

    // Log after response is sent (non-blocking)
    res.on('finish', async () => {
        try {
            const userId = req.user._id || req.user.userId;

            // Determine action type
            let action = 'SYSTEM_CONFIG';
            if (req.method === 'POST') action = 'CREATE';
            else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
            else if (req.method === 'DELETE') action = 'DELETE';
            else if (req.method === 'GET') action = 'VIEW';

            // Determine entity type from path
            let entityType = 'SYSTEM';
            if (req.path.includes('/users')) entityType = 'USER';
            else if (req.path.includes('/transactions')) entityType = 'TRANSACTION';
            else if (req.path.includes('/categories')) entityType = 'CATEGORY';
            else if (req.path.includes('/wallets')) entityType = 'WALLET';
            else if (req.path.includes('/budgets')) entityType = 'BUDGET';

            // Sanitize request body for logging
            let sanitizedBody = null;
            if (stateChangingMethods.includes(req.method) && req.body) {
                sanitizedBody = { ...req.body };
                // Remove sensitive fields
                const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'csrfToken'];
                sensitiveFields.forEach(field => {
                    if (sanitizedBody[field]) {
                        sanitizedBody[field] = '[REDACTED]';
                    }
                });
            }

            // Create audit log (non-blocking)
            AuditLog.create({
                adminId: userId,
                action,
                entityType,
                entityId: req.params?.id || null,
                changes: sanitizedBody ? { after: sanitizedBody } : null,
                metadata: {
                    ipAddress: clientIp,
                    userAgent: userAgent.substring(0, 200),
                    requestId,
                    additionalInfo: {
                        method: req.method,
                        path: req.path,
                        query: req.query,
                        statusCode: responseStatus
                    }
                },
                timestamp: new Date(),
                status: responseStatus >= 400 ? 'FAILED' : 'SUCCESS'
            }).catch(error => {
                logger.errorWithMetadata('Failed to create audit log', {
                    requestId,
                    error: error.message
                });
            });

        } catch (error) {
            logger.errorWithMetadata('Audit logging error', {
                requestId,
                error: error.message
            });
        }
    });

    next();
};

// ============================================
// IP Whitelist Middleware
// ============================================

/**
 * Parse CIDR notation to IP range
 * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns {Object} Object with start and end IP as integers
 */
const parseCidr = (cidr) => {
    const [ip, prefix] = cidr.split('/');
    const prefixLength = parseInt(prefix, 10);
    const ipParts = ip.split('.').map(Number);
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];

    const mask = -1 << (32 - prefixLength);
    const startIp = ipInt & mask;
    const endIp = startIp + Math.pow(2, 32 - prefixLength) - 1;

    return { startIp, endIp };
};

/**
 * Convert IP address to integer
 * @param {string} ip - IP address
 * @returns {number} IP as integer
 */
const ipToInt = (ip) => {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
};

/**
 * Check if IP is in whitelist
 * @param {string} ip - IP address to check
 * @param {Array} whitelist - Array of allowed IPs or CIDR ranges
 * @returns {boolean} True if whitelisted
 */
const isIpWhitelisted = (ip, whitelist) => {
    if (!whitelist || whitelist.length === 0) {
        return true; // If no whitelist configured, allow all
    }

    for (const entry of whitelist) {
        // Check exact match
        if (entry === ip) {
            return true;
        }

        // Check CIDR notation
        if (entry.includes('/')) {
            try {
                const { startIp, endIp } = parseCidr(entry);
                const ipInt = ipToInt(ip);
                if (ipInt >= startIp && ipInt <= endIp) {
                    return true;
                }
            } catch (error) {
                logger.warnWithMetadata('Invalid CIDR notation', { cidr: entry });
            }
        }
    }

    return false;
};

/**
 * Middleware to check IP whitelist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const ipWhitelistMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    try {
        // Get whitelist from environment variable
        const whitelistEnv = process.env.IP_WHITELIST;
        if (!whitelistEnv) {
            return next(); // No whitelist configured
        }

        const whitelist = whitelistEnv.split(',').map(ip => ip.trim());

        if (!isIpWhitelisted(clientIp, whitelist)) {
            logger.warnWithMetadata('IP not whitelisted', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new AuthorizationError('IP not authorized');
        }

        logger.debugWithMetadata('IP whitelist check passed', {
            requestId,
            clientIp
        });

        next();
    } catch (error) {
        next(error);
    }
};

// ============================================
// Request Size Limiter
// ============================================

/**
 * Middleware to limit request body size based on content type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const requestSizeLimiter = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    const contentLength = parseInt(req.headers['content-length'], 10);

    if (isNaN(contentLength)) {
        return next();
    }

    const contentType = req.headers['content-type'] || '';

    // Define limits based on content type
    let maxSize = 10 * 1024 * 1024; // Default 10MB

    if (contentType.includes('application/json')) {
        maxSize = 10 * 1024 * 1024; // 10MB for JSON
    } else if (contentType.includes('multipart/form-data')) {
        maxSize = 50 * 1024 * 1024; // 50MB for form data
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        maxSize = 5 * 1024 * 1024; // 5MB for form data
    }

    if (contentLength > maxSize) {
        logger.warnWithMetadata('Request size limit exceeded', {
            requestId,
            clientIp,
            contentLength,
            maxSize,
            contentType
        });

        return res.status(413).json({
            error: 'Payload Too Large',
            message: `Request body exceeds maximum size of ${maxSize / (1024 * 1024)}MB for ${contentType}`
        });
    }

    next();
};

// ============================================
// Security Headers Middleware
// ============================================

/**
 * Middleware to set security headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const securityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // HSTS (HTTPS Strict Transport Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Content Security Policy
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    const permissionsPolicy = [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()'
    ];
    res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));

    // Remove server identification
    res.removeHeader('X-Powered-By');

    next();
};

// ============================================
// Suspicious Activity Detector
// ============================================

/**
 * Detect SQL injection patterns - simplified to avoid ReDoS
 * @param {string} value - Value to check
 * @returns {boolean} True if SQL injection detected
 */
const detectSqlInjection = (value) => {
    if (typeof value !== 'string') return false;
    
    const sqlPatterns = [
        /('|%27|%22|--|;|%3B)/i,
        /(union|select|insert|delete|update|drop|alter|create|exec|execute)\s/i,
        /(or|and)\s+\d+\s*=\s*\d+/i
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
};

/**
 * Detect XSS patterns - simplified to avoid ReDoS
 * @param {string} value - Value to check
 * @returns {boolean} True if XSS detected
 */
const detectXss = (value) => {
    if (typeof value !== 'string') return false;
    
    // Simple, non-backtracking patterns only
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\s*\(/i,
        /expression\s*\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(value));
};

/**
 * Get request pattern key
 * @param {string} ip - IP address
 * @returns {string} Pattern key
 */
const getPatternKey = (ip) => `ip:${ip}`;

/**
 * Update request pattern tracking
 * @param {string} ip - IP address
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 */
const updateRequestPattern = (ip, path, method) => {
    const key = getPatternKey(ip);
    const now = Date.now();

    let pattern = requestPatterns.get(key);
    if (!pattern) {
        pattern = {
            requests: [],
            suspiciousCount: 0,
            firstSeen: now
        };
    }

    // Add current request
    pattern.requests.push({
        timestamp: now,
        path,
        method
    });

    // Keep only last 100 requests and remove old ones (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    pattern.requests = pattern.requests.filter(
        req => now - req.timestamp < oneHour
    ).slice(-100);

    requestPatterns.set(key, pattern);
    return pattern;
};

/**
 * Check for rapid requests
 * @param {Object} pattern - Request pattern
 * @returns {boolean} True if rapid requests detected
 */
const checkRapidRequests = (pattern) => {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Count requests in last minute
    const recentRequests = pattern.requests.filter(
        req => now - req.timestamp < oneMinute
    );

    // Threshold: 100 requests per minute
    return recentRequests.length > 100;
};

/**
 * Check for unusual paths
 * @param {Object} pattern - Request pattern
 * @param {string} currentPath - Current request path
 * @returns {boolean} True if unusual path detected
 */
const checkUnusualPaths = (pattern, currentPath) => {
    const suspiciousPaths = [
        /\/\.env/i,
        /\/\.git/i,
        /\/\.htaccess/i,
        /\/config/i,
        /\/admin/i,
        /\/wp-admin/i,
        /\/phpmyadmin/i,
        /\/api\/v[0-9]+\/internal/i,
        /\/(api|rest)\/debug/i
    ];

    return suspiciousPaths.some(sp => sp.test(currentPath));
};

/**
 * Block an IP address
 * @param {string} ip - IP to block
 * @param {string} reason - Reason for blocking
 */
const blockIp = (ip, reason) => {
    blockedIps.add(ip);
    logger.errorWithMetadata('IP blocked due to suspicious activity', {
        ip,
        reason,
        timestamp: new Date().toISOString()
    });
};

/**
 * Middleware to detect suspicious activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const suspiciousActivityDetector = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
        // Check if IP is already blocked
        if (blockedIps.has(clientIp)) {
            logger.warnWithMetadata('Request from blocked IP', {
                requestId,
                clientIp,
                path: req.path
            });
            throw new AuthorizationError('Access denied');
        }

        // Update request pattern
        const pattern = updateRequestPattern(clientIp, req.path, req.method);

        // Check for various suspicious patterns
        const checks = [
            { name: 'rapid_requests', check: () => checkRapidRequests(pattern) },
            { name: 'unusual_paths', check: () => checkUnusualPaths(pattern, req.path) },
            { name: 'sql_injection', check: () => {
                const requestData = JSON.stringify({ query: req.query, body: req.body });
                return detectSqlInjection(requestData);
            }},
            { name: 'xss_attempt', check: () => {
                const requestData = JSON.stringify({ query: req.query, body: req.body });
                return detectXss(requestData);
            }}
        ];

        for (const { name, check } of checks) {
            if (check()) {
                pattern.suspiciousCount++;

                logger.warnWithMetadata('Suspicious activity detected', {
                    requestId,
                    clientIp,
                    userAgent: userAgent.substring(0, 100),
                    type: name,
                    path: req.path,
                    suspiciousCount: pattern.suspiciousCount
                });

                // Auto-block after 5 suspicious activities
                if (pattern.suspiciousCount >= 5) {
                    blockIp(clientIp, `Multiple suspicious activities: ${name}`);
                    throw new AuthorizationError('Access denied due to suspicious activity');
                }

                break;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

// ============================================
// Cleanup Functions
// ============================================

/**
 * Clean up expired CSRF tokens
 */
const cleanupExpiredCsrfTokens = () => {
    const now = Date.now();
    for (const [sessionId, data] of csrfTokenStore.entries()) {
        if (now > data.expiresAt) {
            csrfTokenStore.delete(sessionId);
        }
    }
};

/**
 * Clean up old request patterns
 */
const cleanupOldPatterns = () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, pattern] of requestPatterns.entries()) {
        pattern.requests = pattern.requests.filter(
            req => now - req.timestamp < oneHour
        );

        if (pattern.requests.length === 0) {
            requestPatterns.delete(key);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(() => {
    cleanupExpiredCsrfTokens();
    cleanupOldPatterns();
}, 5 * 60 * 1000);

// ============================================
// Exports
// ============================================

module.exports = {
    adminRoleMiddleware,
    requestSanitization,
    csrfProtection,
    requestSigning,
    auditLogMiddleware,
    ipWhitelistMiddleware,
    requestSizeLimiter,
    securityHeaders,
    suspiciousActivityDetector,
    // Utility functions for testing and external use
    generateCsrfToken,
    validateCsrfToken,
    verifyRequestSignature,
    calculateBodyHash,
    isIpWhitelisted,
    detectSqlInjection,
    detectXss,
    escapeHtml,
    removeHtmlTags,
    sanitizeValue
};
