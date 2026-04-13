/**
 * Error Classes
 * Comprehensive error class hierarchy for the application
 */

/**
 * Base Application Error class
 * All custom errors should extend this class
 */
class AppError extends Error {
    /**
     * Create a new application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Error code
     * @param {boolean} isOperational - Whether the error is operational (expected)
     */
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.timestamp = new Date().toISOString();

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error
 * Used when input validation fails
 */
class ValidationError extends AppError {
    /**
     * Create a validation error
     * @param {string} message - Error message
     * @param {Array} details - Validation error details
     */
    constructor(message = 'Validation failed', details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

/**
 * Authentication Error
 * Used when authentication fails (invalid credentials, etc.)
 */
class AuthenticationError extends AppError {
    /**
     * Create an authentication error
     * @param {string} message - Error message
     */
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

/**
 * Authorization Error
 * Used when user lacks permission to access a resource
 */
class AuthorizationError extends AppError {
    /**
     * Create an authorization error
     * @param {string} message - Error message
     */
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Not Found Error
 * Used when a requested resource is not found
 */
class NotFoundError extends AppError {
    /**
     * Create a not found error
     * @param {string} message - Error message
     * @param {string} resource - Resource type that was not found
     */
    constructor(message = 'Resource not found', resource = null) {
        super(message, 404, 'NOT_FOUND');
        this.resource = resource;
    }
}

/**
 * Conflict Error
 * Used when there's a conflict with the current state of the resource
 */
class ConflictError extends AppError {
    /**
     * Create a conflict error
     * @param {string} message - Error message
     */
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

/**
 * Rate Limit Error
 * Used when rate limit is exceeded
 */
class RateLimitError extends AppError {
    /**
     * Create a rate limit error
     * @param {string} message - Error message
     * @param {number} retryAfter - Seconds to wait before retry
     */
    constructor(message = 'Rate limit exceeded', retryAfter = null) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
}

/**
 * Internal Server Error
 * Used for unexpected server errors
 */
class InternalServerError extends AppError {
    /**
     * Create an internal server error
     * @param {string} message - Error message
     */
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_SERVER_ERROR', false);
    }
}

/**
 * Database Error
 * Used for database-related errors
 */
class DatabaseError extends AppError {
    /**
     * Create a database error
     * @param {string} message - Error message
     * @param {string} operation - Database operation that failed
     */
    constructor(message = 'Database error', operation = null) {
        super(message, 500, 'DATABASE_ERROR', false);
        this.operation = operation;
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalServerError,
    DatabaseError
};
