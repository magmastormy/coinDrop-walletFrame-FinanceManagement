require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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
const analyticsRoutes = require('./routes/analyticsRoutes');

const parseAllowedOrigins = () => {
    const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return raw
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
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
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin not allowed'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
        credentials: true
    }));

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

    app.use(apiLimiter);
    app.use('/api/zhipuai', aiLimiter);

    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ limit: '2mb', extended: true }));

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
            console.log(JSON.stringify(entry));
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

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.path}`
        });
    });

    app.use((err, req, res, _next) => {
        const statusCode = err.status || 500;
        const message = statusCode >= 500
            ? 'Something went wrong'
            : err.message || 'Request failed';

        console.error(JSON.stringify({
            level: 'error',
            requestId: req.requestId,
            path: req.path,
            method: req.method,
            statusCode,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }));

        res.status(statusCode).json({
            error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
            message,
            requestId: req.requestId
        });
    });

    return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
