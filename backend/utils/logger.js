/**
 * Logger
 * Handles logging using winston with structured logging support
 */
const winston = require('winston');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define log format with correlation ID support
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, correlationId, ...metadata }) => {
        const correlationPart = correlationId ? `[${correlationId}] ` : '';
        // If metadata is not a plain object (e.g. a string was passed as
        // extra data), avoid iterating its keys (which yields {"0":"C",...}).
        let metadataPart = '';
        if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
            const keys = Object.keys(metadata).filter(k => typeof metadata[k] !== 'undefined');
            if (keys.length > 0) {
                try { metadataPart = ` ${JSON.stringify(metadata)}`; }
                catch (_) { metadataPart = ` [metadata non-serializable]`; }
            }
        } else if (metadata !== undefined && metadata !== null) {
            metadataPart = ` ${String(metadata)}`;
        }
        return `${timestamp} ${level}: ${correlationPart}${message}${metadataPart}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'coindrip-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport for all environments
        new winston.transports.Console({
            format: consoleFormat
        }),
        
        // File transport for errors (production)
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        
        // File transport for combined logs (production)
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        
        // File transport for info logs (production)
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/info.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        
        // CloudWatch transport for production
        ...(process.env.NODE_ENV === 'production' ? [
            new (require('winston-cloudwatch'))({
                logGroupName: '/ecs/coindrop',
                logStreamName: 'application-logs',
                awsRegion: 'us-east-1',
                jsonMessage: true,
                retentionInDays: 14
            })
        ] : [])
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            new (require('winston-cloudwatch'))({
                logGroupName: '/ecs/coindrop',
                logStreamName: 'exceptions',
                awsRegion: 'us-east-1',
                jsonMessage: true,
                retentionInDays: 14
            })
        ] : [])
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            new (require('winston-cloudwatch'))({
                logGroupName: '/ecs/coindrop',
                logStreamName: 'rejections',
                awsRegion: 'us-east-1',
                jsonMessage: true,
                retentionInDays: 14
            })
        ] : [])
    ]
});

// Add correlation ID support
/**
 * Create a logger with correlation ID
 * @param {string} correlationId - Correlation ID
 * @returns {Object} Logger instance with correlation ID
 */
logger.correlate = (correlationId) => {
    const id = correlationId || uuidv4();
    return logger.child({ correlationId: id });
};

// Add request logging middleware
/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
logger.requestLogger = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.requestId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    const requestLogger = logger.correlate(correlationId);
    const start = Date.now();
    
    requestLogger.info('Request started', {
        method: req.method,
        path: req.path,
        query: req.query,
        userId: req.user?.userId || req.authUserId
    });
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        
        requestLogger[level]('Request completed', {
            method: req.method,
            path: req.path,
            statusCode,
            duration,
            userId: req.user?.userId || req.authUserId
        });
    });
    
    next();
};

// Add structured logging methods
/**
 * Log with metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} metadata - Log metadata
 * @returns {void}
 */
logger.logWithMetadata = (level, message, metadata = {}) => {
    logger[level](message, metadata);
};

/**
 * Log info with metadata
 * @param {string} message - Log message
 * @param {Object} metadata - Log metadata
 * @returns {void}
 */
logger.infoWithMetadata = (message, metadata = {}) => {
    logger.info(message, metadata);
};

/**
 * Log error with metadata
 * @param {string} message - Log message
 * @param {Object} metadata - Log metadata
 * @returns {void}
 */
logger.errorWithMetadata = (message, metadata = {}) => {
    logger.error(message, metadata);
};

/**
 * Log warn with metadata
 * @param {string} message - Log message
 * @param {Object} metadata - Log metadata
 * @returns {void}
 */
logger.warnWithMetadata = (message, metadata = {}) => {
    logger.warn(message, metadata);
};

/**
 * Log debug with metadata
 * @param {string} message - Log message
 * @param {Object} metadata - Log metadata
 * @returns {void}
 */
logger.debugWithMetadata = (message, metadata = {}) => {
    logger.debug(message, metadata);
};

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Add health check endpoint for logging
/**
 * Get log statistics
 * @returns {Object} Log statistics
 */
logger.getLogStats = () => {
    try {
        const logsDirStats = fs.statSync(logsDir);
        return {
            logsDir: logsDir,
            exists: true,
            size: logsDirStats.size
        };
    } catch (error) {
        return {
            logsDir: logsDir,
            exists: false,
            error: error.message
        };
    }
};

module.exports = logger;
