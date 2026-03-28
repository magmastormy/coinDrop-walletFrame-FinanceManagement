/**
 * Error Handler
 * Handles error creation, formatting, and logging
 */
const logger = require('./logger');
const metricsCollector = require('./metricsCollector');

// Standard error codes
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DUPLICATE_KEY: 'DUPLICATE_KEY',
    CAST_ERROR: 'CAST_ERROR',
    JWT_ERROR: 'JWT_ERROR',
    JWT_EXPIRED: 'JWT_EXPIRED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    CACHE_ERROR: 'CACHE_ERROR',
    QUEUE_ERROR: 'QUEUE_ERROR',
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN'
};

/**
 * Application error class
 */
class AppError extends Error {
    /**
     * Create a new application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Error code
     * @param {boolean} isOperational - Whether the error is operational
     * @param {Object} metadata - Additional metadata
     */
    constructor(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR, isOperational = true, metadata = {}) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        this.metadata = metadata;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error handler class
 */
class ErrorHandler {
    /**
     * Global error handler
     * @param {Error} err - Error object
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     * @returns {void}
     */
    static handleError(err, req, res, next) {
        // Create structured error log
        const errorLog = {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            requestId: req.requestId,
            userId: req.user?.userId || req.authUserId,
            statusCode: err.statusCode || 500,
            errorCode: err.errorCode || ERROR_CODES.SERVER_ERROR,
            message: err.message,
            stack: err.stack,
            metadata: err.metadata || {},
            timestamp: new Date().toISOString()
        };

        // Redact sensitive information
        if (req.body) {
            errorLog.body = {
                ...req.body
            };
            ['password', 'newPassword', 'currentPassword', 'token', 'accessToken', 'refreshToken', 'creditCard', 'ssn'].forEach(key => {
                if (key in errorLog.body) {
                    errorLog.body[key] = '[REDACTED]';
                }
            });
        }

        // Log the error
        if (err.statusCode >= 500) {
            logger.error('Server Error', errorLog);
            metricsCollector.incrementCounter('server_errors_total', 1, { errorCode: err.errorCode });
        } else if (err.statusCode >= 400) {
            logger.warn('Client Error', errorLog);
            metricsCollector.incrementCounter('client_errors_total', 1, { errorCode: err.errorCode });
        }

        // Determine error response
        const statusCode = err.statusCode || 500;
        const errorResponse = {
            success: false,
            status: err.status || 'error',
            message: err.message || 'Internal Server Error',
            errorCode: err.errorCode || ERROR_CODES.SERVER_ERROR,
            timestamp: err.timestamp || new Date().toISOString(),
            requestId: req.requestId,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                path: req.path,
                method: req.method,
                metadata: err.metadata
            })
        };

        // Send error response
        res.status(statusCode).json(errorResponse);
    }

    /**
     * Create a new application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Error code
     * @param {boolean} isOperational - Whether the error is operational
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static createError(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR, isOperational = true, metadata = {}) {
        return new AppError(message, statusCode, errorCode, isOperational, metadata);
    }

    /**
     * Handle validation error
     * @param {Error} err - Mongoose validation error
     * @returns {AppError} AppError instance
     */
    static handleValidationError(err) {
        const errors = Object.values(err.errors).map(el => el.message);
        const message = `Invalid input data. ${errors.join('. ')}`;
        return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    /**
     * Handle duplicate key error
     * @param {Error} err - MongoDB duplicate key error
     * @returns {AppError} AppError instance
     */
    static handleDuplicateKeyError(err) {
        const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
        const message = `Duplicate field value: ${value}. Please use another value!`;
        return new AppError(message, 400, ERROR_CODES.DUPLICATE_KEY);
    }

    /**
     * Handle cast error
     * @param {Error} err - Mongoose cast error
     * @returns {AppError} AppError instance
     */
    static handleCastError(err) {
        const message = `Invalid ${err.path}: ${err.value}.`;
        return new AppError(message, 400, ERROR_CODES.CAST_ERROR);
    }

    /**
     * Handle JWT error
     * @returns {AppError} AppError instance
     */
    static handleJWTError() {
        return new AppError('Invalid token. Please log in again!', 401, ERROR_CODES.JWT_ERROR);
    }

    /**
     * Handle JWT expired error
     * @returns {AppError} AppError instance
     */
    static handleJWTExpiredError() {
        return new AppError('Your token has expired! Please log in again.', 401, ERROR_CODES.JWT_EXPIRED);
    }

    /**
     * Handle circuit breaker error
     * @param {string} serviceName - Service name
     * @returns {AppError} AppError instance
     */
    static handleCircuitBreakerError(serviceName) {
        return new AppError(
            `${serviceName} service is temporarily unavailable. Please try again later.`,
            503,
            ERROR_CODES.CIRCUIT_BREAKER_OPEN,
            true,
            { serviceName }
        );
    }

    /**
     * Handle cache error
     * @param {Error} err - Cache error
     * @returns {AppError} AppError instance
     */
    static handleCacheError(err) {
        return new AppError(
            'Cache service error',
            503,
            ERROR_CODES.CACHE_ERROR,
            true,
            { error: err.message }
        );
    }

    /**
     * Handle queue error
     * @param {Error} err - Queue error
     * @returns {AppError} AppError instance
     */
    static handleQueueError(err) {
        return new AppError(
            'Queue service error',
            503,
            ERROR_CODES.QUEUE_ERROR,
            true,
            { error: err.message }
        );
    }

    /**
     * Handle AI service error
     * @param {Error} err - AI service error
     * @returns {AppError} AppError instance
     */
    static handleAIError(err) {
        return new AppError(
            'AI service error',
            503,
            ERROR_CODES.AI_SERVICE_ERROR,
            true,
            { error: err.message }
        );
    }

    /**
     * Handle database error
     * @param {Error} err - Database error
     * @returns {AppError} AppError instance
     */
    static handleDatabaseError(err) {
        return new AppError(
            'Database error',
            503,
            ERROR_CODES.DATABASE_ERROR,
            true,
            { error: err.message }
        );
    }

    /**
     * Handle external API error
     * @param {Error} err - External API error
     * @param {string} apiName - API name
     * @returns {AppError} AppError instance
     */
    static handleExternalApiError(err, apiName) {
        return new AppError(
            `${apiName} service error`,
            503,
            ERROR_CODES.EXTERNAL_API_ERROR,
            true,
            { error: err.message, apiName }
        );
    }

    /**
     * Create bad request error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static badRequest(message, errorCode = ERROR_CODES.BAD_REQUEST, metadata = {}) {
        return new AppError(message, 400, errorCode, true, metadata);
    }

    /**
     * Create unauthorized error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static unauthorized(message = 'Unauthorized access', errorCode = ERROR_CODES.UNAUTHORIZED, metadata = {}) {
        return new AppError(message, 401, errorCode, true, metadata);
    }

    /**
     * Create forbidden error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static forbidden(message = 'Access forbidden', errorCode = ERROR_CODES.FORBIDDEN, metadata = {}) {
        return new AppError(message, 403, errorCode, true, metadata);
    }

    /**
     * Create not found error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static notFound(message = 'Resource not found', errorCode = ERROR_CODES.NOT_FOUND, metadata = {}) {
        return new AppError(message, 404, errorCode, true, metadata);
    }

    /**
     * Create server error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static serverError(message = 'Internal server error', errorCode = ERROR_CODES.SERVER_ERROR, metadata = {}) {
        return new AppError(message, 500, errorCode, true, metadata);
    }

    /**
     * Create service unavailable error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static serviceUnavailable(message = 'Service unavailable', errorCode = ERROR_CODES.SERVICE_UNAVAILABLE, metadata = {}) {
        return new AppError(message, 503, errorCode, true, metadata);
    }

    /**
     * Create too many requests error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     */
    static tooManyRequests(message = 'Too many requests', errorCode = ERROR_CODES.TOO_MANY_REQUESTS, metadata = {}) {
        return new AppError(message, 429, errorCode, true, metadata);
    }

    /**
     * Async error handler wrapper
     * @param {Function} fn - Async function
     * @returns {Function} Wrapped function
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Sync error handler wrapper
     * @param {Function} fn - Sync function
     * @returns {Function} Wrapped function
     */
    static syncHandler(fn) {
        return (req, res, next) => {
            try {
                fn(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = {
    AppError,
    ErrorHandler,
    ERROR_CODES
};
