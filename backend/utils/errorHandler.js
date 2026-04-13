/**
 * Error Handler
 * Handles error creation, formatting, and logging
 */
const logger = require('./logger');
const metricsCollector = require('./metricsCollector');
const {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalServerError,
    DatabaseError
} = require('./errorClasses');

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
    CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
    CONFLICT: 'CONFLICT',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

/**
 * Handle JWT Error
 * Converts JWT errors to AuthenticationError
 * @param {Error} err - JWT error
 * @returns {AuthenticationError} AuthenticationError instance
 */
function handleJWTError(err) {
    const message = err.message || 'Invalid token. Please log in again!';
    return new AuthenticationError(message);
}

/**
 * Handle JWT Expired Error
 * Converts JWT expired errors to AuthenticationError
 * @returns {AuthenticationError} AuthenticationError instance
 */
function handleJWTExpiredError() {
    return new AuthenticationError('Your token has expired! Please log in again.');
}

/**
 * Handle Validation Error
 * Converts Mongoose validation errors to ValidationError
 * @param {Error} err - Mongoose validation error
 * @returns {ValidationError} ValidationError instance
 */
function handleValidationError(err) {
    const errors = Object.values(err.errors).map(el => ({
        field: el.path,
        message: el.message,
        value: el.value
    }));
    const message = `Invalid input data. ${errors.map(e => e.message).join('. ')}`;
    return new ValidationError(message, errors);
}

/**
 * Handle Cast Error
 * Converts Mongoose cast errors (invalid ObjectId, etc.) to ValidationError
 * @param {Error} err - Mongoose cast error
 * @returns {ValidationError} ValidationError instance
 */
function handleCastError(err) {
    const message = `Invalid ${err.path}: ${err.value}.`;
    const details = [{
        field: err.path,
        message: `Invalid value for ${err.path}`,
        value: err.value
    }];
    return new ValidationError(message, details);
}

/**
 * Handle Duplicate Fields Error
 * Converts MongoDB duplicate key errors to ConflictError
 * @param {Error} err - MongoDB duplicate key error
 * @returns {ConflictError} ConflictError instance
 */
function handleDuplicateFieldsError(err) {
    const value = err.message.match(/(["'])(\?.)*?\1/)?.[0] || 'value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ConflictError(message);
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
        // Convert known error types to our error classes
        let error = err;

        if (err.name === 'ValidationError') {
            error = handleValidationError(err);
        } else if (err.name === 'CastError') {
            error = handleCastError(err);
        } else if (err.code === 11000) {
            error = handleDuplicateFieldsError(err);
        } else if (err.name === 'JsonWebTokenError') {
            error = handleJWTError(err);
        } else if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        } else if (!(err instanceof AppError)) {
            // Wrap unknown errors as internal server errors
            error = new InternalServerError(err.message || 'Something went wrong');
        }

        // Create structured error log
        const errorLog = {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            requestId: req.requestId,
            userId: req.user?.userId || req.authUserId,
            statusCode: error.statusCode || 500,
            errorCode: error.code || ERROR_CODES.SERVER_ERROR,
            message: error.message,
            stack: error.stack,
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
        if (error.statusCode >= 500) {
            logger.error('Server Error', errorLog);
            metricsCollector.incrementCounter('server_errors_total', 1, { errorCode: error.code });
        } else if (error.statusCode >= 400) {
            logger.warn('Client Error', errorLog);
            metricsCollector.incrementCounter('client_errors_total', 1, { errorCode: error.code });
        }

        // Build error response with standardized format
        const errorResponse = {
            success: false,
            error: {
                code: error.code || ERROR_CODES.SERVER_ERROR,
                message: error.message || 'Internal Server Error',
                details: error.details || null
            }
        };

        // Add additional metadata in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.error.stack = error.stack;
            errorResponse.error.path = req.path;
            errorResponse.error.method = req.method;
            errorResponse.error.timestamp = error.timestamp || new Date().toISOString();
            errorResponse.error.requestId = req.requestId;
        }

        // Send error response
        res.status(error.statusCode || 500).json(errorResponse);
    }

    /**
     * Create a new application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Error code
     * @param {boolean} isOperational - Whether the error is operational
     * @param {Object} metadata - Additional metadata
     * @returns {AppError} AppError instance
     * @deprecated Use error classes from errorClasses.js directly
     */
    static createError(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR, isOperational = true, metadata = {}) {
        return new AppError(message, statusCode, errorCode, isOperational, metadata);
    }

    /**
     * Handle validation error (static method)
     * @param {Error} err - Mongoose validation error
     * @returns {ValidationError} ValidationError instance
     */
    static handleValidationError(err) {
        return handleValidationError(err);
    }

    /**
     * Handle duplicate key error
     * @param {Error} err - MongoDB duplicate key error
     * @returns {ConflictError} ConflictError instance
     */
    static handleDuplicateKeyError(err) {
        return handleDuplicateFieldsError(err);
    }

    /**
     * Handle cast error
     * @param {Error} err - Mongoose cast error
     * @returns {ValidationError} ValidationError instance
     */
    static handleCastError(err) {
        return handleCastError(err);
    }

    /**
     * Handle JWT error
     * @param {Error} err - JWT error
     * @returns {AuthenticationError} AuthenticationError instance
     */
    static handleJWTError(err) {
        return handleJWTError(err);
    }

    /**
     * Handle JWT expired error
     * @returns {AuthenticationError} AuthenticationError instance
     */
    static handleJWTExpiredError() {
        return handleJWTExpiredError();
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
     * @returns {DatabaseError} DatabaseError instance
     */
    static handleDatabaseError(err) {
        return new DatabaseError(
            err.message || 'Database error',
            err.operation
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
     * @returns {ValidationError} ValidationError instance
     */
    static badRequest(message, errorCode = ERROR_CODES.BAD_REQUEST, metadata = {}) {
        const error = new ValidationError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
    }

    /**
     * Create unauthorized error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AuthenticationError} AuthenticationError instance
     */
    static unauthorized(message = 'Unauthorized access', errorCode = ERROR_CODES.UNAUTHORIZED, metadata = {}) {
        const error = new AuthenticationError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
    }

    /**
     * Create forbidden error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {AuthorizationError} AuthorizationError instance
     */
    static forbidden(message = 'Access forbidden', errorCode = ERROR_CODES.FORBIDDEN, metadata = {}) {
        const error = new AuthorizationError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
    }

    /**
     * Create not found error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {NotFoundError} NotFoundError instance
     */
    static notFound(message = 'Resource not found', errorCode = ERROR_CODES.NOT_FOUND, metadata = {}) {
        const error = new NotFoundError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
    }

    /**
     * Create server error
     * @param {string} message - Error message
     * @param {string} errorCode - Error code
     * @param {Object} metadata - Additional metadata
     * @returns {InternalServerError} InternalServerError instance
     */
    static serverError(message = 'Internal server error', errorCode = ERROR_CODES.SERVER_ERROR, metadata = {}) {
        const error = new InternalServerError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
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
     * @returns {RateLimitError} RateLimitError instance
     */
    static tooManyRequests(message = 'Too many requests', errorCode = ERROR_CODES.TOO_MANY_REQUESTS, metadata = {}) {
        const error = new RateLimitError(message);
        error.code = errorCode;
        Object.assign(error, metadata);
        return error;
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
    ERROR_CODES,
    handleJWTError,
    handleJWTExpiredError,
    handleValidationError,
    handleCastError,
    handleDuplicateFieldsError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalServerError,
    DatabaseError
};
