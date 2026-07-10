require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { swaggerUiOptions } = require('./config/swagger');

const logger = require('./utils/logger');
logger.debug('🔄 app.js: Loading...');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

logger.debug('✅ app.js: Core dependencies loaded (express, cors, rate-limit)');
logger.debug('✅ app.js: Logger loaded');

const { sanitizationMiddleware } = require('./middleware/validationMiddleware');
logger.debug('✅ app.js: Validation middleware loaded');

const auditMiddleware = require('./middleware/auditMiddleware');
logger.debug('✅ app.js: Audit middleware loaded');

logger.debug('🔄 app.js: Loading routes...');
const receiptRoutes = require('./routes/receiptRoutes');
logger.debug('✅ app.js: Receipt routes loaded');
const authRoutes = require('./routes/authRoutes');
logger.debug('✅ app.js: Auth routes loaded');
const transactionRoutes = require('./routes/transactionRoutes');
logger.debug('✅ app.js: Transaction routes loaded');
const walletRoutes = require('./routes/walletRoutes');
logger.debug('✅ app.js: Wallet routes loaded');
const budgetRoutes = require('./routes/budgetRoutes');
logger.debug('✅ app.js: Budget routes loaded');
const settingsRoutes = require('./routes/settingsRoutes');
logger.debug('✅ app.js: Settings routes loaded');
const profileRoutes = require('./routes/profileRoutes');
logger.debug('✅ app.js: Profile routes loaded');
const categoryRoutes = require('./routes/categoryRoutes');
logger.debug('✅ app.js: Category routes loaded');
const educationRoutes = require('./routes/educationRoutes');
logger.debug('✅ app.js: Education routes loaded');
const savingsAccountRoutes = require('./routes/savingsAccountRoutes');
logger.debug('✅ app.js: Savings account routes loaded');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
logger.debug('✅ app.js: Savings goal routes loaded');
const savingsRuleRoutes = require('./routes/savingsRuleRoutes');
logger.debug('✅ app.js: Savings rule routes loaded');
const zhipuaiRoutes = require('./routes/zhipuaiRoutes');
logger.debug('✅ app.js: ZhipuAI routes loaded');
const imageRoutes = require('./routes/imageRoutes');
logger.debug('✅ app.js: Image routes loaded');
const reportRoutes = require('./routes/reportRoutes');
logger.debug('✅ app.js: Report routes loaded');
const analyticsRoutes = require('./routes/analyticsRoutes');
logger.debug('✅ app.js: Analytics routes loaded');
const cryptoRoutes = require('./routes/cryptoRoutes');
logger.debug('✅ app.js: Crypto routes loaded');
const adminRoutes = require('./routes/adminRoutes');
logger.debug('✅ app.js: Admin routes loaded');
const thirdPartyIntegrationRoutes = require('./routes/thirdPartyIntegrationRoutes');
logger.debug('✅ app.js: Third-party integration routes loaded');

logger.debug('🔄 app.js: Loading utilities...');
const connectionPoolMonitor = require('./utils/connectionPoolMonitor');
logger.debug('✅ app.js: Connection pool monitor loaded');
const metricsCollector = require('./utils/metricsCollector');
logger.debug('✅ app.js: Metrics collector loaded');

const BatchUtil = require('./utils/batchUtils');
logger.debug('✅ app.js: Batch utility loaded');

const { ErrorHandler } = require('./utils/errorHandler');
logger.debug('✅ app.js: Error handler loaded');

// Initialize connection pool monitoring
if (process.env.NODE_ENV !== 'test') {
    connectionPoolMonitor.start(5000); // Monitor every 5 seconds
}

// Record system metrics periodically
let metricsInterval;
if (process.env.NODE_ENV !== 'test') {
    metricsInterval = setInterval(() => {
        metricsCollector.recordSystemMetrics();
    }, 10000); // Every 10 seconds
}

const parseAllowedOrigins = () => {
    const raw = process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:63704,http://localhost:3000,http://127.0.0.1:3000';
    return raw
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
};

const DEV_PORT_RANGE_REGEX = /^http:\/\/(localhost|127\.0\.0\.1):(300[0-9]|517[0-9])$/;

const isOriginAllowed = (origin, allowedOrigins) => {
    if (!origin) return true;
    
    for (const allowed of allowedOrigins) {
        if (allowed === origin) {
            return true;
        }
    }
    
    if (process.env.NODE_ENV !== 'production' && DEV_PORT_RANGE_REGEX.test(origin)) {
        return true;
    }
    
    return false;
};

const redactSensitiveFields = (payload = {}) => {
    const redacted = { ...payload };
    ['password', 'newPassword', 'currentPassword', 'token', 'accessToken', 'refreshToken'].forEach(key => {
        if (key in redacted) {
            redacted[key] = '[REDACTED]';
        }
    });
    return redacted;
};

function createApp() {
    const app = express();
    const allowedOrigins = parseAllowedOrigins();

    app.use((req, res, next) => {
        const requestId = req.headers['x-request-id'] || crypto.randomUUID();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        next();
    });

    app.use(cors({
        origin: (origin, callback) => {
            if (isOriginAllowed(origin, allowedOrigins)) {
                callback(null, true);
                return;
            }
            const errorMsg = `CORS origin not allowed: ${origin}`;
            logger.warn(errorMsg, { origin, allowedOrigins });
            callback(new Error('CORS origin not allowed'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'X-CSRF-Token'],
        credentials: true
    }));

    // HTTPS enforcement in production
    app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'production' && req.protocol === 'http') {
            return res.redirect(`https://${req.get('host')}${req.url}`);
        }
        next();
    });

    // Security headers
    app.use((req, res, next) => {
        // HTTP Strict Transport Security
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        // Content Security Policy
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self';");
        
        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');
        
        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions Policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()');
        
        // Cross-Origin-Embedder-Policy
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        
        // Cross-Origin-Opener-Policy
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        
        // Cross-Origin-Resource-Policy
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        
        next();
    });

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: Number(process.env.API_RATE_LIMIT_MAX || 300),
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 429,
            error: 'Too many requests',
            message: 'Please try again later'
        },
        skip: req => req.path === '/api/health' || process.env.NODE_ENV === 'test'
    });

    const aiLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: Number(process.env.AI_RATE_LIMIT_MAX || 20),
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 429,
            error: 'Too many AI requests',
            message: 'AI service is currently under high load. Please try again later.'
        },
        skip: () => process.env.NODE_ENV === 'test'
    });

    // PER-USER RATE LIMITING - Prevents single user from monopolizing AI
    // Only applies to authenticated users; unauthenticated requests fall back to IP-based limiting
    const perUserLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute sliding window
        max: 5, // 5 requests per user per minute
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.userId || req.authUserId;
            if (!userId) {
                logger.warn('Per-user rate limiter called without authenticated user', {
                    path: req.path,
                    ip: req.ip
                });
            }
            return `user:${userId}`;
        },
        message: {
            status: 429,
            error: 'Too many requests',
            message: 'You have exceeded the rate limit of 5 requests per minute. Please slow down.'
        },
        skip: (req) => {
            if (process.env.NODE_ENV === 'test') return true;
            const userId = req.user?.userId || req.authUserId;
            if (!userId) {
                return true;
            }
            return false;
        }
    });

    // Stricter rate limits for financial operations
    const financialLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 transactions per minute
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 429,
            error: 'Too many financial operations',
            message: 'Too many financial operations, please slow down'
        },
        skip: () => process.env.NODE_ENV === 'test'
    });

    app.use(apiLimiter);
    app.use('/api/zhipuai', aiLimiter);
    // Apply per-user limits to prevent abuse
    app.use('/api/zhipuai/send', perUserLimiter);
    // Apply stricter limits to financial endpoints
    app.use('/api/wallets/transfer', financialLimiter);
    app.use('/api/transactions', financialLimiter);
    app.use('/api/saving-accounts/deposit', financialLimiter);
    app.use('/api/saving-accounts/withdraw', financialLimiter);
    app.use('/api/saving-goals/contribute', financialLimiter);

    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ limit: '2mb', extended: true }));
    app.use(sanitizationMiddleware);
    app.use(auditMiddleware);

    // Resource management middleware - must be before routes
    try {
        const resourceManagementService = require('./services/resourceManagementService');
        resourceManagementService.initialize();
        app.use((req, res, next) => {
            if (!resourceManagementService.canAcceptNewConnection()) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Server is currently at capacity. Please try again later.'
                });
            }
            resourceManagementService.incrementConnectionCount();
            res.on('finish', () => {
                resourceManagementService.decrementConnectionCount();
            });
            next();
        });
        logger.debug('✅ app.js: Resource management middleware added');
    } catch (e) {
        logger.debug('⚠️ app.js: Resource management service not available, skipping');
    }

    app.use((req, res, next) => {
        const startedAt = Date.now();
        const safeBody = req.method === 'GET' ? undefined : redactSensitiveFields(req.body);

        res.on('finish', () => {
            const entry = {
                level: res.statusCode >= 500 ? 'error' : 'info',
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt,
                body: safeBody
            };
            if (res.statusCode === 401 || res.statusCode === 403) {
                entry.level = 'warn';
                entry.securityEvent = 'authz_denied';
            }
            
            // Use structured logger instead of console.log
            if (entry.level === 'error') {
                logger.error('Request failed', entry);
            } else if (entry.level === 'warn') {
                logger.warn('Security event', entry);
            } else {
                logger.info('Request completed', entry);
            }
        });

        next();
    });

    app.use((req, res, next) => {
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
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/crypto', cryptoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', thirdPartyIntegrationRoutes);

    // Metrics endpoint for monitoring
    app.get('/api/metrics', (req, res) => {
        const metrics = metricsCollector.getMetrics();
        res.type('application/json').json(metrics);
    });

    // Prometheus format metrics endpoint
    app.get('/api/metrics/prometheus', (req, res) => {
        res.type('text/plain').send(metricsCollector.exportPrometheus());
    });

    // Connection pool health endpoint
    app.get('/api/health/connection-pool', (req, res) => {
        const poolMetrics = connectionPoolMonitor.getMetrics();
        res.json(poolMetrics);
    });

    // Queue monitoring endpoint
    app.get('/api/health/queue', async (req, res) => {
        try {
            const { getQueueStats } = require('./services/transactionQueueService');
            const queueStats = await getQueueStats();
            res.json(queueStats);
        } catch (error) {
            res.status(500).json({ error: 'Error getting queue stats', message: error.message });
        }
    });

    // COMPREHENSIVE HEALTH CHECK ENDPOINT
    app.get('/api/health', async (req, res) => {
        const mongoose = require('mongoose');
        const os = require('os');
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            checks: {}
        };
        
        let hasCriticalFailure = false;
        
        // Check MongoDB connection
        try {
            const dbState = mongoose.connection.readyState;
            healthStatus.checks.mongodb = {
                status: dbState === 1 ? 'connected' : 'disconnected',
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                readyState: dbState
            };
            if (dbState !== 1) hasCriticalFailure = true;
        } catch (error) {
            healthStatus.checks.mongodb = {
                status: 'error',
                error: error.message
            };
            hasCriticalFailure = true;
        }
        
        // Check Redis connection (if configured)
        if (process.env.REDIS_HOST) {
            try {
                const redisClient = require('./config/redis');
                if (redisClient.isReady()) {
                    healthStatus.checks.redis = {
                        status: 'connected',
                        host: process.env.REDIS_HOST
                    };
                } else {
                    healthStatus.checks.redis = {
                        status: 'disconnected',
                        host: process.env.REDIS_HOST
                    };
                }
            } catch (error) {
                healthStatus.checks.redis = {
                    status: 'error',
                    error: error.message
                };
                // Redis is not critical for basic operation
            }
        }
        
        // System metrics
        healthStatus.system = {
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
            },
            cpu: {
                load: os.loadavg()[0].toFixed(2),
                cores: os.cpus().length
            },
            disk: {
                free: Math.round(os.freemem() / 1024 / 1024),
                total: Math.round(os.totalmem() / 1024 / 1024)
            }
        };
        
        // Determine overall status
        if (hasCriticalFailure) {
            healthStatus.status = 'unhealthy';
            res.status(503);
        } else if (Object.values(healthStatus.checks).some(c => c.status === 'error')) {
            healthStatus.status = 'degraded';
            res.status(200);
        } else {
            res.status(200);
        }
        
        res.json(healthStatus);
    });

    // Swagger API documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
    logger.debug('✅ app.js: Swagger API documentation endpoint added at /api-docs');

    // Serve swagger.json for external tools
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    logger.debug('✅ app.js: Swagger JSON endpoint added at /api-docs.json');

    // API documentation link on root route
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'Welcome to CoinDrop API',
            documentation: {
                swagger_ui: '/api-docs',
                openapi_spec: '/api-docs.json'
            },
            version: '1.0.0',
            status: 'operational'
        });
    });
    logger.debug('✅ app.js: Root route with API documentation links added');

    app.use((req, res, next) => {
        const error = ErrorHandler.notFound(`Cannot ${req.method} ${req.path}`);
        next(error);
    });

    app.use((err, req, res, next) => {
        ErrorHandler.handleError(err, req, res, next);
    });

    return app;
}

const app = createApp();

// Initialize batch utility
new BatchUtil(app);
logger.debug('✅ app.js: Batch utility initialized');

// Resource status endpoint
app.get('/api/health/resources', (req, res) => {
    const resourceManagementService = require('./services/resourceManagementService');
    const resourceStatus = resourceManagementService.getResourceStatus();
    res.json(resourceStatus);
});

logger.debug('✅ app.js: App created successfully');

module.exports = app;
module.exports.createApp = createApp;
