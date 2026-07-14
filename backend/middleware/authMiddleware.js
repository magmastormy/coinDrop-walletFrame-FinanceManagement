/**
 * Authentication Middleware
 * Handles user authentication, authorization, and security checks
 * 
 * Hybrid middleware: tries Clerk first (for frontend users), falls back to JWT
 * for API-only clients. Delegates to clerkAuthMiddleware for Clerk token handling.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AuthenticationError, RateLimitError } = require('../utils/errorClasses');
const { clerkAuthMiddleware, hasClerkConfig } = require('./clerkAuthMiddleware');

// In-memory store for suspicious IPs (in production, use Redis)
const suspiciousIps = new Map();
const blacklistedIps = new Set();

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

/**
 * Check if a token has been revoked for a user
 * @param {string} userId - User ID
 * @param {string} jti - Token JTI (JSON Token Identifier)
 * @returns {Promise<boolean>} True if token is revoked, false otherwise
 */
const isTokenRevoked = async (userId, jti) => {
    try {
        const user = await User.findById(userId).select('tokens');
        if (!user || !user.tokens) {
            return true;
        }
        const tokenExists = user.tokens.some(t => t.jti === jti);
        return !tokenExists;
    } catch (error) {
        logger.errorWithMetadata('Error checking token revocation', {
            userId,
            jti,
            error: error.message
        });
        return true; // Treat errors as revoked for security
    }
};

/**
 * Log suspicious IP activity
 * @param {string} ip - IP address
 * @param {string} reason - Reason for suspicion
 */
const logSuspiciousIp = (ip, reason) => {
    const currentCount = suspiciousIps.get(ip) || { count: 0, reasons: [] };
    currentCount.count += 1;
    currentCount.reasons.push({
        reason,
        timestamp: new Date().toISOString()
    });
    suspiciousIps.set(ip, currentCount);

    logger.warnWithMetadata('Suspicious IP activity detected', {
        ip,
        reason,
        totalIncidents: currentCount.count,
        timestamp: new Date().toISOString()
    });

    // Auto-blacklist after 10 suspicious activities
    if (currentCount.count >= 10) {
        blacklistedIps.add(ip);
        logger.errorWithMetadata('IP auto-blacklisted due to repeated suspicious activity', {
            ip,
            incidentCount: currentCount.count
        });
    }
};

/**
 * Check if IP is blacklisted
 * @param {string} ip - IP address
 * @returns {boolean} True if blacklisted
 */
const isIpBlacklisted = (ip) => {
    return blacklistedIps.has(ip);
};

/**
 * Middleware to authenticate user using JWT token
 * Validates token, checks revocation status, and verifies user account state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
const authMiddleware = async (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    try {
        const token = extractToken(req);

        if (!token) {
            logger.warnWithMetadata('Authentication failed: No token provided', {
                requestId,
                clientIp,
                path: req.path,
                method: req.method
            });
            throw new AuthenticationError('No token provided');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (hasClerkConfig() && jwtError.name === 'JsonWebTokenError') {
                return await clerkAuthMiddleware(req, res, next);
            }

            logger.warnWithMetadata('Authentication failed: JWT verification error', {
                requestId,
                clientIp,
                errorType: jwtError.name,
                errorMessage: jwtError.message
            });

            if (jwtError.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token has expired');
            } else if (jwtError.name === 'JsonWebTokenError') {
                throw new AuthenticationError('Invalid token');
            } else {
                throw new AuthenticationError('Token verification failed');
            }
        }

        const userId = decoded.userId || decoded._id || decoded.id;
        const tokenJti = decoded.jti;

        if (!userId) {
            logger.warnWithMetadata('Authentication failed: Invalid token payload', {
                requestId,
                clientIp,
                decodedKeys: Object.keys(decoded)
            });
            throw new AuthenticationError('Invalid token payload');
        }

        // Check if token has been revoked (only for refresh tokens - access tokens aren't stored in tokens array)
        if (tokenJti && decoded.type === 'refresh') {
            const revoked = await isTokenRevoked(userId, tokenJti);
            if (revoked) {
                logger.warnWithMetadata('Authentication failed: Token has been revoked', {
                    requestId,
                    clientIp,
                    userId,
                    tokenJti
                });
                throw new AuthenticationError('Token has been revoked');
            }
        }

        // Fetch user from database
        const user = await User.findById(userId).select('-password');

        if (!user) {
            logger.warnWithMetadata('Authentication failed: User not found', {
                requestId,
                clientIp,
                userId
            });
            throw new AuthenticationError('User not found');
        }

        // Check if user account is locked
        if (user.isLocked) {
            logger.warnWithMetadata('Authentication failed: Account is locked', {
                requestId,
                clientIp,
                userId,
                lockUntil: user.lockUntil
            });
            throw new AuthenticationError('Account is locked');
        }

        // Check if user is active (not deleted)
        // Note: This assumes there's an isActive or deletedAt field
        // Adjust based on your actual User model
        if (user.isActive === false || user.deletedAt) {
            logger.warnWithMetadata('Authentication failed: Account is deactivated', {
                requestId,
                clientIp,
                userId
            });
            throw new AuthenticationError('Account has been deactivated');
        }

        // Attach user object to request (without password)
        req.user = user.toObject ? user.toObject() : user;
        delete req.user.password;

        // Attach token JTI for audit logging
        req.tokenJti = tokenJti;
        req.authUserId = userId;

        // Log successful authentication
        logger.infoWithMetadata('Authentication successful', {
            requestId,
            clientIp,
            userId,
            tokenJti,
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        // Log authentication failure
        if (!(error instanceof AuthenticationError)) {
            logger.errorWithMetadata('Authentication error', {
                requestId,
                clientIp,
                error: error.message,
                stack: error.stack
            });
        }
        next(error);
    }
};

/**
 * Optional Token Middleware
 * Similar to authMiddleware but doesn't throw error if no token
 * Useful for routes that work with or without authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
const optionalTokenMiddleware = async (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    try {
        // Extract token from Authorization header
        const token = extractToken(req);

        // If no token, set user to null and continue
        if (!token) {
            req.user = null;
            req.tokenJti = null;
            req.authUserId = null;

            logger.debugWithMetadata('Optional auth: No token provided, continuing as anonymous', {
                requestId,
                clientIp,
                path: req.path
            });

            return next();
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            // For optional auth, just set user to null on token error
            logger.debugWithMetadata('Optional auth: Invalid token, continuing as anonymous', {
                requestId,
                clientIp,
                errorType: jwtError.name
            });

            req.user = null;
            req.tokenJti = null;
            req.authUserId = null;
            return next();
        }

        const userId = decoded.userId || decoded._id || decoded.id;
        const tokenJti = decoded.jti;

        if (!userId) {
            req.user = null;
            req.tokenJti = null;
            req.authUserId = null;
            return next();
        }

        // Check if token has been revoked (only for refresh tokens)
        if (tokenJti && decoded.type === 'refresh') {
            const revoked = await isTokenRevoked(userId, tokenJti);
            if (revoked) {
                logger.debugWithMetadata('Optional auth: Token revoked, continuing as anonymous', {
                    requestId,
                    clientIp,
                    userId
                });

                req.user = null;
                req.tokenJti = null;
                req.authUserId = null;
                return next();
            }
        }

        // Fetch user from database
        const user = await User.findById(userId).select('-password');

        if (!user || user.isLocked || user.isActive === false || user.deletedAt) {
            // User not found or inactive, continue as anonymous
            req.user = null;
            req.tokenJti = null;
            req.authUserId = null;
            return next();
        }

        // Attach user object to request
        req.user = user.toObject ? user.toObject() : user;
        delete req.user.password;
        req.tokenJti = tokenJti;
        req.authUserId = userId;

        logger.debugWithMetadata('Optional auth: User authenticated', {
            requestId,
            clientIp,
            userId
        });

        next();
    } catch (error) {
        // On any error, continue as anonymous
        logger.debugWithMetadata('Optional auth: Error during authentication, continuing as anonymous', {
            requestId,
            clientIp,
            error: error.message
        });

        req.user = null;
        req.tokenJti = null;
        req.authUserId = null;
        next();
    }
};

/**
 * Session Validation Middleware
 * Validates session beyond just token verification
 * Can check IP consistency, user agent, etc.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
const validateSession = async (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
        if (!req.user) {
            throw new AuthenticationError('Authentication required for session validation');
        }

        const userId = req.authUserId;

        // Additional session validation checks can be added here
        // For example:
        // - Check if session is stored in Redis/database
        // - Validate session hasn't expired beyond token expiry
        // - Check for concurrent session limits

        // Log session validation for audit
        logger.debugWithMetadata('Session validated', {
            requestId,
            clientIp,
            userId,
            userAgent: userAgent.substring(0, 100), // Truncate for logging
            timestamp: new Date().toISOString()
        });

        // Attach session metadata to request
        req.sessionMeta = {
            validatedAt: new Date().toISOString(),
            clientIp,
            userAgent
        };

        next();
    } catch (error) {
        logger.errorWithMetadata('Session validation failed', {
            requestId,
            clientIp,
            error: error.message
        });
        next(error);
    }
};

/**
 * IP-based Security Check Middleware
 * Logs suspicious IP activity and can block requests from blacklisted IPs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const checkIpSecurity = (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
        // Check if IP is blacklisted
        if (isIpBlacklisted(clientIp)) {
            logger.errorWithMetadata('Request blocked: IP is blacklisted', {
                requestId,
                clientIp,
                userAgent: userAgent.substring(0, 100),
                path: req.path
            });

            const error = new RateLimitError('Access denied due to suspicious activity', 3600);
            return next(error);
        }

        // Check for suspicious patterns
        const suspiciousPatterns = [
            { pattern: /sqlmap|nikto|nmap|masscan/i, reason: 'Security scanner detected' },
            { pattern: /\$\{|%24%7B/i, reason: 'Potential injection attack' },
            { pattern: /<script|%3Cscript/i, reason: 'Potential XSS attempt' },
            { pattern: /\.\./, reason: 'Path traversal attempt' },
            { pattern: /etc\/passwd|win\.ini/i, reason: 'File access attempt' }
        ];

        const requestData = JSON.stringify({
            query: req.query,
            body: req.body,
            headers: req.headers,
            path: req.path
        });

        for (const { pattern, reason } of suspiciousPatterns) {
            if (pattern.test(requestData)) {
                logSuspiciousIp(clientIp, reason);
                break;
            }
        }

        // Check for rapid requests from same IP (basic rate limiting indicator)
        const ipData = suspiciousIps.get(clientIp);
        if (ipData && ipData.count >= 5) {
            logger.warnWithMetadata('IP with multiple suspicious activities detected', {
                requestId,
                clientIp,
                incidentCount: ipData.count
            });
        }

        next();
    } catch (error) {
        logger.errorWithMetadata('IP security check error', {
            requestId,
            clientIp,
            error: error.message
        });
        next(error);
    }
};

/**
 * Middleware to check user role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const roleMiddleware = (roles) => {
    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        if (!roles.includes(req.userProfile.communityRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Middleware to check user expertise level
 * @param {Array} areas - Array of expertise areas
 * @param {string} minLevel - Minimum expertise level
 * @returns {Function} Middleware function
 */
const expertiseMiddleware = (areas, minLevel = 'intermediate') => {
    const levelHierarchy = {
        'beginner': 0,
        'intermediate': 1,
        'advanced': 2,
        'expert': 3
    };

    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        const hasRequiredExpertise = req.userProfile.expertise.some(exp =>
            areas.includes(exp.area) &&
            levelHierarchy[exp.level] >= levelHierarchy[minLevel]
        );

        if (!hasRequiredExpertise) {
            return res.status(403).json({ error: 'Required expertise level not met' });
        }

        next();
    };
};

/**
 * Middleware to check user reputation score
 * @param {number} minScore - Minimum reputation score required
 * @returns {Function} Middleware function
 */
const reputationMiddleware = (minScore) => {
    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        if (req.userProfile.reputation.score < minScore) {
            return res.status(403).json({ error: 'Insufficient reputation score' });
        }

        next();
    };
};

/**
 * Middleware to check user account verification status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
const verificationMiddleware = async (req, res, next) => {
    if (!req.userProfile) {
        return res.status(403).json({ error: 'User profile not found' });
    }

    if (!req.userProfile.verificationStatus.isVerified) {
        return res.status(403).json({ error: 'Account verification required' });
    }

    next();
};

/**
 * Middleware to check user moderation privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
const moderationMiddleware = async (req, res, next) => {
    if (!req.userProfile) {
        return res.status(403).json({ error: 'User profile not found' });
    }

    const moderationRoles = ['moderator', 'admin'];
    if (!moderationRoles.includes(req.userProfile.communityRole)) {
        return res.status(403).json({ error: 'Moderation privileges required' });
    }

    next();
};

module.exports = {
    authMiddleware,
    optionalTokenMiddleware,
    validateSession,
    checkIpSecurity,
    isTokenRevoked,
    roleMiddleware,
    expertiseMiddleware,
    reputationMiddleware,
    verificationMiddleware,
    moderationMiddleware,
    // Export for testing and external use
    extractToken,
    isIpBlacklisted,
    logSuspiciousIp
};
