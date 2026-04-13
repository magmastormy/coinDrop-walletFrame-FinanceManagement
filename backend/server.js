const logger = require('./utils/logger');

// Wrap all requires in try-catch to identify failure point
let dotenv, mongoose, connectDB, ensureUploadDirectories, initCloudinary, categoryInit, CategoryAIService, app, redisClient;

try {
    logger.debug('🔄 Loading dotenv...');
    dotenv = require('dotenv');
    dotenv.config();
    logger.debug('✅ dotenv loaded');
} catch (error) {
    logger.error('❌ Failed to load dotenv:', error.message);
    process.exit(1);
}

try {
    logger.debug('🔄 Loading mongoose...');
    mongoose = require('mongoose');
    logger.debug('✅ mongoose loaded');
} catch (error) {
    logger.error('❌ Failed to load mongoose:', error.message);
    process.exit(1);
}

try {
    logger.debug('🔄 Loading database config...');
    connectDB = require('./config/db');
    logger.debug('✅ database config loaded');
} catch (error) {
    logger.error('❌ Failed to load database config:', error.message);
    process.exit(1);
}

try {
    logger.debug('🔄 Loading ensureUploadDirectories...');
    ensureUploadDirectories = require('./utils/ensureUploadDirs');
    logger.debug('✅ ensureUploadDirectories loaded');
} catch (error) {
    logger.error('❌ Failed to load ensureUploadDirectories:', error.message);
    process.exit(1);
}

try {
    logger.debug('🔄 Loading cloudinary config...');
    initCloudinary = require('./config/cloudinary').initCloudinary;
    logger.debug('✅ cloudinary config loaded');
} catch (error) {
    logger.error('❌ Failed to load cloudinary config:', error.message);
    // Don't exit - Cloudinary is optional
}

try {
    logger.debug('🔄 Loading category initialization...');
    categoryInit = require('./config/categoryInit');
    logger.debug('✅ category initialization loaded');
} catch (error) {
    logger.error('❌ Failed to load category initialization:', error.message);
    // Don't exit - categories can be initialized later
}

try {
    logger.debug('🔄 Loading AI categorization service...');
    CategoryAIService = require('./ai/categoryAIService');
    logger.debug('✅ AI categorization service loaded');
} catch (error) {
    logger.error('❌ Failed to load AI categorization service:', error.message);
    // Don't exit - AI service is optional
}

try {
    logger.debug('🔄 Loading Express app...');
    app = require('./app');
    logger.debug('✅ Express app loaded');
} catch (error) {
    logger.error('❌ Failed to load Express app:', error.message);
    process.exit(1);
}

try {
    logger.debug('🔄 Loading Redis client...');
    redisClient = require('./config/redis');
    logger.debug('✅ Redis client loaded');
} catch (error) {
    logger.error('❌ Failed to load Redis client:', error.message);
    // Don't exit - Redis is optional
}

// Initialize database first with proper error handling
logger.debug('🔄 Starting backend initialization...');
logger.debug('📍 Node version:', process.version);
logger.debug('📍 Working directory:', process.cwd());
logger.debug('📍 ENV PORT:', process.env.PORT);

connectDB()
    .then(async () => {
        logger.debug('✅ Database connected successfully');
        
        // Initialize Redis connection (non-blocking and optional)
        if (redisClient) {
            redisClient.connect()
                .then(() => logger.debug('✅ Redis connection initialized'))
                .catch(err => logger.error('⚠️ Redis connection initialization failed:', err.message));
        }
        
        // Continue with other initializations
        // initCloudinary();
        // logger.debug('✅ Cloudinary initialized');
        
        // categoryInit();
        // logger.debug('✅ Categories initialized');
        
        logger.debug('✅ Express app loaded');
        
        // Initialize AI categorization service (non-blocking and optional)
        setTimeout(() => {
            CategoryAIService.initialize()
                .then(() => logger.debug('✅ AI Categorization Service initialized'))
                .catch(err => logger.error('⚠️ AI Categorization Service initialization failed:', err.message));
        }, 2000); // Delay to ensure server is fully started
        
        ensureUploadDirectories()
            .then(() => logger.debug('✅ Upload directories ready'))
            .catch(err => logger.error('⚠️ Error setting up upload directories:', err.message));
        
        // Start the server
        const PORT = process.env.PORT || 5002;
        const serverConfig = {
            timeout: 120000,
            keepAliveTimeout: 65000,
            headersTimeout: 66000
        };
        
        const server = app.listen(PORT, () => {
            logger.debug(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.debug(`⏱️ Server timeout: ${serverConfig.timeout}ms, Keep-alive: ${serverConfig.keepAliveTimeout}ms`);
            logger.debug(`🌐 API Base URL: ${process.env.REACT_APP_API_BASE_URL}\n`);
        });
        
        server.timeout = serverConfig.timeout;
        server.keepAliveTimeout = serverConfig.keepAliveTimeout;
        server.headersTimeout = serverConfig.headersTimeout;
        
        // Connection tracking
        const connections = {};
        let connectionCounter = 0;
        
        server.on('connection', conn => {
            const id = connectionCounter++;
            connections[id] = conn;
        
            conn.on('close', () => {
                delete connections[id];
            });
        });
        
        // Graceful shutdown handler
        function gracefulShutdown(signal) {
            logger.debug(`\n🛑 ${signal} signal received: initiating graceful shutdown`);
        
            server.close(() => {
                logger.debug('🔒 HTTP server closed, no longer accepting connections');
        
                // Close Redis connection if it exists
                const closeRedis = redisClient ? redisClient.disconnect() : Promise.resolve();
                
                // Mongoose v8+: close() returns a promise, no callback
                closeRedis
                    .then(() => mongoose.connection.close(false))
                    .then(() => {
                        logger.debug('🔴 MongoDB connection closed');
                        process.exit(0);
                    })
                    .catch(err => {
                        logger.error('❌ Error during graceful shutdown:', err);
                        process.exit(1);
                    });
            });
        
            setTimeout(() => {
                logger.debug('⚠️ Graceful shutdown timed out, forcing exit');
                process.exit(1);
            }, 30000);
        
            Object.keys(connections).forEach(key => {
                const conn = connections[key];
                conn.end();
                setTimeout(() => {
                    if (!conn.destroyed) {
                        conn.destroy();
                    }
                }, 5000);
            });
        }
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', err => {
            logger.error('\n❌ Uncaught Exception:', err);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });
        
        module.exports = app;
    })
    .catch(error => {
        logger.error('\n❌ FATAL ERROR: Failed to initialize backend');
        logger.error('Error:', error.message);
        logger.error('\n💡 Please check:\n   - MongoDB Atlas cluster status\n   - Network connectivity\n   - Firewall settings\n   - Database credentials in .env file\n');
        process.exit(1);
    });
