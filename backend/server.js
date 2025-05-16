require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const ensureUploadDirectories = require('./utils/ensureUploadDirs');
const receiptRoutes = require('./routes/receiptRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const profileRoutes = require('./routes/profileRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const educationRoutes = require('./routes/educationRoutes');
const savingsAccountRoutes = require('./routes/savingsAccountRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
const savingsRuleRoutes = require('./routes/savingsRuleRoutes');
const zhipuaiRoutes = require('./routes/zhipuaiRoutes');
const imageRoutes = require('./routes/imageRoutes');
const reportRoutes = require('./routes/reportRoutes');
//const testRoutes = require('./routes/testRoutes');

const {initCloudinary} = require('./config/cloudinary');
const categoryInit = require('./config/categoryInit');
const app = express();

// Connect Database
connectDB();

// Initialize Cloudinary
initCloudinary();

//Initialize the CategoryAI
categoryInit();

// Ensure upload directories exist
ensureUploadDirectories()
    .then(() => console.log('Upload directories ready'))
    .catch(err => console.error('Error setting up upload directories:', err));

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply rate limiting to all requests - relaxed for testing environment
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 50000000000000000000000000, // increased from 60 to 500 for testing
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        error: 'Too many requests',
        message: 'Please try again later'
    },
    // Skip rate limiting for health check endpoint and during testing
    skip: (req) => req.path === '/api/health' || process.env.NODE_ENV === 'test'
});

// Apply rate limiting to AI endpoints - relaxed for testing environment
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100, // increased from 10 to 100 for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many AI requests',
        message: 'AI service is currently under high load. Please try again later.'
    }
});

// Apply the rate limiters
app.use(apiLimiter);
app.use('/api/zhipuai', aiLimiter);

app.use(express.json({ extended: false }));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Add request timeout handling
app.use((req, res, next) => {
    // Add a timeout handler to the response
    res.setTimeout(30000, () => {
        if (!res.headersSent) {
            res.status(408).json({
                error: 'Request Timeout',
                message: 'The server timed out processing the request'
            });
        }
    });
    next();
});

// Define Routes
app.use('/api/receipts', receiptRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/saving-accounts', savingsAccountRoutes);
app.use('/api/saving-goals', savingsGoalRoutes);
app.use('/api/savings-rules', savingsRuleRoutes);
app.use('/api/zhipuai', zhipuaiRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/reports', reportRoutes);
//app.use('/api/test', testRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        env: process.env.NODE_ENV || 'development'
    });
});

// 404 Not Found Handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Global Error Handler with improved error classification and handling
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
    
    // Classify errors for better client feedback
    let statusCode = err.status || 500;
    let errorType = 'Internal Server Error';
    let errorMessage = err.message || 'Something went wrong';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorType = 'Validation Error';
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
        statusCode = 409;
        errorType = 'Duplicate Entry';
        errorMessage = 'A record with this information already exists';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        errorType = 'Invalid ID';
        errorMessage = 'The provided ID is invalid';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorType = 'Authentication Error';
        errorMessage = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorType = 'Authentication Error';
        errorMessage = 'Token expired';
    } else if (err.message && err.message.includes('timeout')) {
        statusCode = 408;
        errorType = 'Request Timeout';
        errorMessage = 'The operation timed out. Please try again later.';
    } else if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
        statusCode = 503;
        errorType = 'Database Unavailable';
        errorMessage = 'Database operation timed out. The system is currently under high load.';
    }
    
    // Log error details for monitoring
    console.error(`[${errorType}] ${statusCode} - ${errorMessage}`);
    
    // Send error response
    res.status(statusCode).json({
        error: errorType,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

const PORT = process.env.PORT || 5001;

// Set server timeout values
const serverConfig = {
    timeout: 120000, // 2 minutes
    keepAliveTimeout: 65000, // slightly higher than ALB's idle timeout (60s)
    headersTimeout: 66000, // slightly higher than keepAliveTimeout
};

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Server timeout: ${serverConfig.timeout}ms, Keep-alive: ${serverConfig.keepAliveTimeout}ms`);
});

// Configure server timeouts
server.timeout = serverConfig.timeout;
server.keepAliveTimeout = serverConfig.keepAliveTimeout;
server.headersTimeout = serverConfig.headersTimeout;

// Track active connections for graceful shutdown
let connections = {};
let connectionCounter = 0;

server.on('connection', (conn) => {
    const id = connectionCounter++;
    connections[id] = conn;
    
    conn.on('close', () => {
        delete connections[id];
    });
});

// Graceful Shutdown with connection draining
function gracefulShutdown(signal) {
    console.log(`${signal} signal received: initiating graceful shutdown`);
    
    // Stop accepting new connections
    server.close(() => {
        console.log('HTTP server closed, no longer accepting connections');
        
        // Close MongoDB connection
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
    
    // Set a timeout for forceful shutdown if graceful shutdown takes too long
    setTimeout(() => {
        console.log('Graceful shutdown timed out, forcing exit');
        process.exit(1);
    }, 30000); // 30 seconds
    
    // Close existing connections
    Object.keys(connections).forEach(key => {
        const conn = connections[key];
        conn.end(); // End the connection gracefully
        
        // Force close after a timeout
        setTimeout(() => {
            if (!conn.destroyed) {
                conn.destroy();
            }
        }, 5000); // 5 seconds
    });
}

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log but don't shut down for unhandled rejections
});

module.exports = app;