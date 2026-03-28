// Wrap all requires in try-catch to identify failure point
let dotenv, mongoose, connectDB, ensureUploadDirectories, initCloudinary, categoryInit, CategoryAIService, app, redisClient;

try {
    console.log('🔄 Loading dotenv...');
    dotenv = require('dotenv');
    dotenv.config();
    console.log('✅ dotenv loaded');
} catch (error) {
    console.error('❌ Failed to load dotenv:', error.message);
    process.exit(1);
}

try {
    console.log('🔄 Loading mongoose...');
    mongoose = require('mongoose');
    console.log('✅ mongoose loaded');
} catch (error) {
    console.error('❌ Failed to load mongoose:', error.message);
    process.exit(1);
}

try {
    console.log('🔄 Loading database config...');
    connectDB = require('./config/db');
    console.log('✅ database config loaded');
} catch (error) {
    console.error('❌ Failed to load database config:', error.message);
    process.exit(1);
}

try {
    console.log('🔄 Loading ensureUploadDirectories...');
    ensureUploadDirectories = require('./utils/ensureUploadDirs');
    console.log('✅ ensureUploadDirectories loaded');
} catch (error) {
    console.error('❌ Failed to load ensureUploadDirectories:', error.message);
    process.exit(1);
}

try {
    console.log('🔄 Loading cloudinary config...');
    initCloudinary = require('./config/cloudinary').initCloudinary;
    console.log('✅ cloudinary config loaded');
} catch (error) {
    console.error('❌ Failed to load cloudinary config:', error.message);
    // Don't exit - Cloudinary is optional
}

try {
    console.log('🔄 Loading category initialization...');
    categoryInit = require('./config/categoryInit');
    console.log('✅ category initialization loaded');
} catch (error) {
    console.error('❌ Failed to load category initialization:', error.message);
    // Don't exit - categories can be initialized later
}

try {
    console.log('🔄 Loading AI categorization service...');
    CategoryAIService = require('./ai/categoryAIService');
    console.log('✅ AI categorization service loaded');
} catch (error) {
    console.error('❌ Failed to load AI categorization service:', error.message);
    // Don't exit - AI service is optional
}

try {
    console.log('🔄 Loading Express app...');
    app = require('./app');
    console.log('✅ Express app loaded');
} catch (error) {
    console.error('❌ Failed to load Express app:', error.message);
    process.exit(1);
}

try {
    console.log('🔄 Loading Redis client...');
    redisClient = require('./config/redis');
    console.log('✅ Redis client loaded');
} catch (error) {
    console.error('❌ Failed to load Redis client:', error.message);
    // Don't exit - Redis is optional
}

// Initialize database first with proper error handling
console.log('🔄 Starting backend initialization...');
console.log('📍 Node version:', process.version);
console.log('📍 Working directory:', process.cwd());
console.log('📍 ENV PORT:', process.env.PORT);

connectDB()
    .then(async () => {
        console.log('✅ Database connected successfully');
        
        // Initialize Redis connection (non-blocking and optional)
        if (redisClient) {
            redisClient.connect()
                .then(() => console.log('✅ Redis connection initialized'))
                .catch(err => console.error('⚠️ Redis connection initialization failed:', err.message));
        }
        
        // Continue with other initializations
        // initCloudinary();
        // console.log('✅ Cloudinary initialized');
        
        // categoryInit();
        // console.log('✅ Categories initialized');
        
        console.log('✅ Express app loaded');
        
        // Initialize AI categorization service (non-blocking and optional)
        setTimeout(() => {
            CategoryAIService.initialize()
                .then(() => console.log('✅ AI Categorization Service initialized'))
                .catch(err => console.error('⚠️ AI Categorization Service initialization failed:', err.message));
        }, 2000); // Delay to ensure server is fully started
        
        ensureUploadDirectories()
            .then(() => console.log('✅ Upload directories ready'))
            .catch(err => console.error('⚠️ Error setting up upload directories:', err.message));
        
        // Start the server
        const PORT = process.env.PORT || 5002;
        const serverConfig = {
            timeout: 120000,
            keepAliveTimeout: 65000,
            headersTimeout: 66000
        };
        
        const server = app.listen(PORT, () => {
            console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`⏱️ Server timeout: ${serverConfig.timeout}ms, Keep-alive: ${serverConfig.keepAliveTimeout}ms`);
            console.log(`🌐 API Base URL: ${process.env.REACT_APP_API_BASE_URL}\n`);
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
            console.log(`\n🛑 ${signal} signal received: initiating graceful shutdown`);
        
            server.close(() => {
                console.log('🔒 HTTP server closed, no longer accepting connections');
        
                // Close Redis connection if it exists
                const closeRedis = redisClient ? redisClient.disconnect() : Promise.resolve();
                
                // Mongoose v8+: close() returns a promise, no callback
                closeRedis
                    .then(() => mongoose.connection.close(false))
                    .then(() => {
                        console.log('🔴 MongoDB connection closed');
                        process.exit(0);
                    })
                    .catch(err => {
                        console.error('❌ Error during graceful shutdown:', err);
                        process.exit(1);
                    });
            });
        
            setTimeout(() => {
                console.log('⚠️ Graceful shutdown timed out, forcing exit');
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
            console.error('\n❌ Uncaught Exception:', err);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });
        
        module.exports = app;
    })
    .catch(error => {
        console.error('\n❌ FATAL ERROR: Failed to initialize backend');
        console.error('Error:', error.message);
        console.error('\n💡 Please check:\n   - MongoDB Atlas cluster status\n   - Network connectivity\n   - Firewall settings\n   - Database credentials in .env file\n');
        process.exit(1);
    });
