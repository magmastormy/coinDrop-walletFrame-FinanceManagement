// Always run relative to this file so `node backend/server.js` and
// `cd backend && node server.js` both work. Without this, relative
// requires like `./routes/...` and `./config/swagger` resolve against
// whatever CWD the caller was in (on Render: the project root).
process.chdir(__dirname);

const logger = require('./utils/logger');

// Wrap all requires in try-catch to identify failure point
let dotenv, mongoose, connectDB, ensureUploadDirectories, initCloudinary, categoryInit, CategoryAIService, app, redisClient;

try {
    dotenv = require('dotenv');
    dotenv.config();
} catch (error) {
    logger.error('Failed to load dotenv:', error.message);
    process.exit(1);
}

try {
    mongoose = require('mongoose');
} catch (error) {
    logger.error('Failed to load mongoose:', error.message);
    process.exit(1);
}

try {
    connectDB = require('./config/db');
} catch (error) {
    logger.error('Failed to load database config:', error.message);
    process.exit(1);
}

try {
    ensureUploadDirectories = require('./utils/ensureUploadDirs');
} catch (error) {
    logger.error('Failed to load ensureUploadDirectories:', error.message);
    process.exit(1);
}

try {
    initCloudinary = require('./config/cloudinary').initCloudinary;
} catch (error) {
    logger.warn('Failed to load cloudinary config:', error.message);
}

try {
    categoryInit = require('./config/categoryInit');
} catch (error) {
    logger.warn('Failed to load category initialization:', error.message);
}

try {
    CategoryAIService = require('./ai/categoryAIService');
} catch (error) {
    logger.warn('Failed to load AI categorization service:', error.message);
}

try {
    app = require('./app');
} catch (error) {
    logger.error('Failed to load Express app:', error.message);
    process.exit(1);
}

try {
    redisClient = require('./config/redis');
} catch (error) {
    logger.warn('Failed to load Redis client:', error.message);
}

connectDB()
    .then(async () => {
        logger.info('Database connected');

        if (redisClient) {
            redisClient.connect()
                .then(() => logger.info('Redis connection initialized'))
                .catch(err => logger.warn('Redis connection failed:', err.message));
        }

        setTimeout(() => {
            CategoryAIService.initialize()
                .then(() => logger.info('AI Categorization Service initialized'))
                .catch(err => logger.warn('AI Categorization Service failed:', err.message));
        }, 2000);

        ensureUploadDirectories()
            .then(() => logger.info('Upload directories ready'))
            .catch(err => logger.warn('Error setting up upload directories:', err.message));

        const PORT = process.env.PORT || 5002;
        const serverConfig = {
            timeout: 120000,
            keepAliveTimeout: 65000,
            headersTimeout: 66000
        };

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

        server.timeout = serverConfig.timeout;
        server.keepAliveTimeout = serverConfig.keepAliveTimeout;
        server.headersTimeout = serverConfig.headersTimeout;

        const connections = {};
        let connectionCounter = 0;

        server.on('connection', conn => {
            const id = connectionCounter++;
            connections[id] = conn;

            conn.on('close', () => {
                delete connections[id];
            });
        });

        function gracefulShutdown(signal) {
            logger.info(`${signal} signal received: initiating graceful shutdown`);

            server.close(() => {
                logger.info('HTTP server closed');

                const closeRedis = redisClient ? redisClient.disconnect() : Promise.resolve();

                closeRedis
                    .then(() => mongoose.connection.close(false))
                    .then(() => {
                        logger.info('MongoDB connection closed');
                        process.exit(0);
                    })
                    .catch(err => {
                        logger.error('Error during graceful shutdown:', err);
                        process.exit(1);
                    });
            });

            setTimeout(() => {
                logger.warn('Graceful shutdown timed out, forcing exit');
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
            logger.error('Uncaught Exception:', err);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection:', reason);
        });

        module.exports = app;
    })
    .catch(error => {
        logger.error('FATAL ERROR: Failed to initialize backend');
        logger.error('Error:', error.message);
        process.exit(1);
    });