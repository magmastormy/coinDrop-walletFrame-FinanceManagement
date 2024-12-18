const logger = require('./logger');

class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

class ErrorHandler {
    // Global error handler
    static handleError(err, req, res, next) {
        // Log the error
        logger.error(`Error: ${err.message}`, {
            method: req.method,
            path: req.path,
            body: req.body,
            stack: err.stack
        });

        // Determine error response
        const statusCode = err.statusCode || 500;
        const errorResponse = {
            status: err.status || 'error',
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        };

        // Send error response
        res.status(statusCode).json(errorResponse);
    }

    // Create a new application error
    static createError(message, statusCode = 500, isOperational = true) {
        return new AppError(message, statusCode, isOperational);
    }

    // Handle specific error types
    static handleValidationError(err) {
        const errors = Object.values(err.errors).map(el => el.message);
        const message = `Invalid input data. ${errors.join('. ')}`;
        return new AppError(message, 400);
    }

    static handleDuplicateKeyError(err) {
        const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
        const message = `Duplicate field value: ${value}. Please use another value!`;
        return new AppError(message, 400);
    }

    static handleCastError(err) {
        const message = `Invalid ${err.path}: ${err.value}.`;
        return new AppError(message, 400);
    }

    static handleJWTError() {
        return new AppError('Invalid token. Please log in again!', 401);
    }

    static handleJWTExpiredError() {
        return new AppError('Your token has expired! Please log in again.', 401);
    }
}

module.exports = {
    AppError,
    ErrorHandler
};
