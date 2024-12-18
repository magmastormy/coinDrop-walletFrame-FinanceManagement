//utils.logger.js
const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tell winston about the colors
winston.addColors(colors);

// Configure log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: logFormat
        }),
        
        // File transport for errors
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // File transport for combined logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Middleware for logging HTTP requests
logger.requestLogger = (req, res, next) => {
    const { method, url, headers } = req;
    const userAgent = headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    logger.http(`${method} ${url} - IP: ${ip} - Agent: ${userAgent}`);
    next();
};

// Error logging method
logger.logError = (error, additionalInfo = {}) => {
    logger.error(JSON.stringify({
        message: error.message,
        stack: error.stack,
        ...additionalInfo
    }));
};

module.exports = logger;