const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Middleware
 * Logs all financial operations for compliance and security
 */
const auditMiddleware = async (req, res, next) => {
    // Skip audit logging for certain routes (e.g., auth, public endpoints)
    const skipRoutes = ['/api/auth/', '/api/health', '/api/public'];
    if (skipRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    // Store original send method
    const originalSend = res.send;
    
    // Capture response body
    let responseBody;
    res.send = function(data) {
        try {
            responseBody = JSON.parse(data);
        } catch (e) {
            responseBody = { status: res.statusCode };
        }
        originalSend.call(this, data);
    };

    // Log after response is sent
    res.on('finish', async () => {
        try {
            // Only log financial operations
            const financialRoutes = [
                '/api/wallets',
                '/api/transactions',
                '/api/budgets',
                '/api/savings-goals',
                '/api/savings-accounts'
            ];

            if (!financialRoutes.some(route => req.path.startsWith(route))) {
                return;
            }

            const userId = req.user?.userId || req.authUserId;
            
            // Determine if this is a large transfer requiring special reporting
            const amount = req.body?.amount || 0;
            const requiresReporting = amount >= 10000; // $10,000 threshold

            // Only create audit log if userId exists (required field)
            if (!userId) {
                return;
            }

            await AuditLog.create({
                userId: userId,
                action: 'API_ACCESS',
                resource: req.path,
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE',
                details: {
                    method: req.method,
                    requestBody: sanitizeRequestBody(req.body),
                    responseBody: sanitizeResponseBody(responseBody),
                    statusCode: res.statusCode,
                    type: getAuditType(req.method, req.path),
                    requiresReporting: requiresReporting
                }
            });
        } catch (error) {
            console.error('Audit logging error:', error);
            // Don't fail the request if audit logging fails
        }
    });

    next();
};

/**
 * Sanitize request body before logging (remove sensitive data)
 */
function sanitizeRequestBody(body) {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'csrfToken'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Sanitize response body before logging
 */
function sanitizeResponseBody(body) {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'csrfToken'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Determine audit type based on request
 */
function getAuditType(method, path) {
    if (path.includes('/wallets')) return 'WALLET_OPERATION';
    if (path.includes('/transactions')) return 'TRANSACTION_OPERATION';
    if (path.includes('/budgets')) return 'BUDGET_OPERATION';
    if (path.includes('/savings-goals')) return 'SAVINGS_GOAL_OPERATION';
    if (path.includes('/savings-accounts')) return 'SAVINGS_ACCOUNT_OPERATION';
    return 'FINANCIAL_OPERATION';
}

module.exports = auditMiddleware;
