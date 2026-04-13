import { useLogger } from './hooks/useLogger';

/**
 * Unified Logger System
 * Production-ready logging for both frontend and backend
 * Replaces: logger.js, secureLogger.js, AuditLog.js, auditLogService.js
 */

class UnifiedLogger {
    constructor(config = {}) {
        this.config = {
            level: config.level || (typeof window !== 'undefined' ? 'info' : process.env.LOG_LEVEL || 'info'),
            service: config.service || 'coindrop',
            environment: config.environment || (typeof window !== 'undefined' ? 'browser' : process.env.NODE_ENV || 'development'),
            version: config.version || '1.0.0',
            enableConsole: config.enableConsole !== false,
            enableFile: config.enableFile !== false && typeof window === 'undefined',
            enableRemote: config.enableRemote !== false,
            remoteEndpoint: config.remoteEndpoint || null,
            apiKey: config.apiKey || null,
            sanitizePII: config.sanitizePII !== false,
            maxRetries: config.maxRetries || 3,
            batchSize: config.batchSize || 100,
            flushInterval: config.flushInterval || 5000
        };

        // Sensitive fields to redact
        this.sensitiveFields = new Set([
            'password', 'newPassword', 'currentPassword', 'confirmPassword',
            'token', 'accessToken', 'refreshToken', 'csrfToken', 'jwt',
            'apiKey', 'apiSecret', 'encryptionKey', 'privateKey',
            'creditCard', 'cardNumber', 'cvv', 'ssn',
            'bankAccount', 'routingNumber', 'secret'
        ]);

        // Log levels
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        // Initialize logging state
        this.logBuffer = [];
        this.sessionId = this.generateSessionId();
        this.correlationId = null;
        this.userId = null;
        this.isBrowser = typeof window !== 'undefined';
        
        // Initialize transports
        this.initializeTransports();
        
        // Start batch flushing
        if (this.config.enableRemote) {
            this.startBatchFlushing();
        }
    }

    /**
     * Initialize logging transports based on environment
     */
    initializeTransports() {
        if (this.isBrowser) {
            // Browser/Client-side logging
            this.transports = [
                this.createConsoleTransport(),
                this.createLocalStorageTransport(),
                this.createRemoteTransport()
            ].filter(Boolean);
        } else {
            // Server-side logging
            this.transports = [
                this.createConsoleTransport(),
                this.createFileTransport(),
                this.createRemoteTransport()
            ].filter(Boolean);
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        if (this.isBrowser) {
            // Browser: use sessionStorage or generate new
            let sessionId = sessionStorage.getItem('coindrop_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('coindrop_session_id', sessionId);
            }
            return sessionId;
        } else {
            // Server: use crypto
            return require('crypto').randomBytes(16).toString('hex');
        }
    }

    /**
     * Create console transport
     */
    createConsoleTransport() {
        if (!this.config.enableConsole) return null;

        return (logEntry) => {
            const level = logEntry.level.toUpperCase();
            const timestamp = new Date(logEntry.timestamp).toISOString();
            const correlationPart = logEntry.correlationId ? `[${logEntry.correlationId}] ` : '';
            const metadataStr = Object.keys(logEntry.metadata || {}).length > 0 
                ? ` ${JSON.stringify(logEntry.metadata)}` 
                : '';

            const message = `${timestamp} ${level}: ${correlationPart}${logEntry.message}${metadataStr}`;
            
            if (this.isBrowser) {
                // Browser console with styling
                const styles = {
                    error: 'color: #ef4444; font-weight: bold;',
                    warn: 'color: #f59e0b; font-weight: bold;',
                    info: 'color: #10b981;',
                    debug: 'color: #6b7280;'
                };
                logInfo(`%c${message}`, styles[logEntry.level] || styles.info);
            } else {
                // Node.js console
                console[level.toLowerCase()](message);
            }
        };
    }

    /**
     * Create local storage transport (browser only)
     */
    createLocalStorageTransport() {
        if (!this.isBrowser) return null;

        return (logEntry) => {
            try {
                const logs = JSON.parse(localStorage.getItem('coindrop_logs') || '[]');
                logs.push({
                    ...logEntry,
                    timestamp: new Date(logEntry.timestamp).toISOString()
                });
                
                // Keep only last 1000 logs
                if (logs.length > 1000) {
                    logs.splice(0, logs.length - 1000);
                }
                
                localStorage.setItem('coindrop_logs', JSON.stringify(logs));
            } catch (error) {
                logWarn('Failed to write to localStorage:', error);
            }
        };
    }

    /**
     * Create file transport (server only)
     */
    createFileTransport() {
        if (this.isBrowser || !this.config.enableFile) return null;

        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(process.cwd(), 'logs');

        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        return (logEntry) => {
            try {
                const logFile = path.join(logsDir, `${logEntry.level}.log`);
                const logLine = JSON.stringify({
                    ...logEntry,
                    timestamp: new Date(logEntry.timestamp).toISOString()
                }) + '\n';
                
                fs.appendFileSync(logFile, logLine);
            } catch (error) {
                logError('Failed to write to log file:', error);
            }
        };
    }

    /**
     * Create remote transport
     */
    createRemoteTransport() {
        if (!this.config.enableRemote || !this.config.remoteEndpoint) return null;

        return (logEntry) => {
            this.logBuffer.push({
                ...logEntry,
                timestamp: new Date(logEntry.timestamp).toISOString()
            });
        };
    }

    /**
     * Start batch flushing for remote logs
     */
    startBatchFlushing() {
        if (this.flushTimer) return;

        this.flushTimer = setInterval(() => {
            this.flushLogs();
        }, this.config.flushInterval);

        // Flush on page unload (browser)
        if (this.isBrowser) {
            window.addEventListener('beforeunload', () => {
                this.flushLogs();
            });
        }

        // Flush on process exit (server)
        if (!this.isBrowser) {
            process.on('SIGINT', () => {
                this.flushLogs();
                process.exit(0);
            });
            process.on('SIGTERM', () => {
                this.flushLogs();
                process.exit(0);
            });
        }
    }

    /**
     * Flush buffered logs to remote endpoint
     */
    async flushLogs() {
        if (this.logBuffer.length === 0) return;

        const logsToSend = this.logBuffer.splice(0, this.config.batchSize);
        
        try {
            const payload = {
                logs: logsToSend,
                metadata: {
                    sessionId: this.sessionId,
                    service: this.config.service,
                    environment: this.config.environment,
                    version: this.config.version,
                    userAgent: this.isBrowser ? navigator.userAgent : undefined,
                    timestamp: new Date().toISOString()
                }
            };

            const response = await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Retry failed logs
            if (this.logBuffer.length > 0) {
                setTimeout(() => this.flushLogs(), 1000);
            }
        } catch (error) {
            // Put failed logs back to buffer for retry
            this.logBuffer.unshift(...logsToSend);
            logError('Failed to flush logs:', error);
            
            // Fallback to local storage if available
            if (this.isBrowser) {
                const failedLogs = JSON.parse(localStorage.getItem('coindrop_failed_logs') || '[]');
                failedLogs.push(...logsToSend);
                localStorage.setItem('coindrop_failed_logs', JSON.stringify(failedLogs));
            }
        }
    }

    /**
     * Sanitize log data by removing sensitive information
     */
    sanitize(data) {
        if (!this.config.sanitizePII || typeof data !== 'object') {
            return data;
        }

        const sanitizeObject = (obj, visited = new Set()) => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            if (visited.has(obj)) {
                return '[Circular Reference]';
            }
            visited.add(obj);

            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item, visited));
            }

            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const keyLower = key.toLowerCase();
                
                if (this.sensitiveFields.has(keyLower) || 
                    keyLower.includes('password') || 
                    keyLower.includes('token') || 
                    keyLower.includes('secret') || 
                    keyLower.includes('key')) {
                    sanitized[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    sanitized[key] = sanitizeObject(value, visited);
                } else {
                    sanitized[key] = value;
                }
            }
            
            return sanitized;
        };

        return sanitizeObject(data);
    }

    /**
     * Create log entry
     */
    createLogEntry(level, message, metadata = {}) {
        return {
            timestamp: new Date(),
            level,
            message,
            correlationId: this.correlationId,
            sessionId: this.sessionId,
            userId: this.userId,
            service: this.config.service,
            environment: this.config.environment,
            metadata: this.sanitize(metadata)
        };
    }

    /**
     * Check if log level should be processed
     */
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.config.level];
    }

    /**
     * Log error message
     */
    error(message, metadata = {}) {
        if (!this.shouldLog('error')) return;
        
        const logEntry = this.createLogEntry('error', message, metadata);
        this.transports.forEach(transport => transport(logEntry));
    }

    /**
     * Log warning message
     */
    warn(message, metadata = {}) {
        if (!this.shouldLog('warn')) return;
        
        const logEntry = this.createLogEntry('warn', message, metadata);
        this.transports.forEach(transport => transport(logEntry));
    }

    /**
     * Log info message
     */
    info(message, metadata = {}) {
        if (!this.shouldLog('info')) return;
        
        const logEntry = this.createLogEntry('info', message, metadata);
        this.transports.forEach(transport => transport(logEntry));
    }

    /**
     * Log debug message
     */
    debug(message, metadata = {}) {
        if (!this.shouldLog('debug')) return;
        
        const logEntry = this.createLogEntry('debug', message, metadata);
        this.transports.forEach(transport => transport(logEntry));
    }

    /**
     * Set correlation ID for request tracing
     */
    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
    }

    /**
     * Set user ID for user context
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * Clear correlation ID
     */
    clearCorrelationId() {
        this.correlationId = null;
    }

    /**
     * Create child logger with additional context
     */
    child(context = {}) {
        const childLogger = new UnifiedLogger(this.config);
        childLogger.correlationId = this.correlationId;
        childLogger.userId = this.userId;
        childLogger.sessionId = this.sessionId;
        
        // Add context to all log entries
        const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
        childLogger.createLogEntry = (level, message, metadata = {}) => {
            return originalCreateLogEntry(level, message, { ...context, ...metadata });
        };
        
        return childLogger;
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration, metadata = {}) {
        this.info(`Performance: ${operation}`, {
            type: 'performance',
            operation,
            duration,
            ...metadata
        });
    }

    /**
     * Log user actions
     */
    userAction(action, metadata = {}) {
        this.info(`User Action: ${action}`, {
            type: 'user_action',
            action,
            ...metadata
        });
    }

    /**
     * Log security events
     */
    security(event, metadata = {}) {
        this.warn(`Security Event: ${event}`, {
            type: 'security',
            event,
            ...metadata
        });
    }

    /**
     * Log API requests
     */
    apiRequest(method, url, statusCode, duration, metadata = {}) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        this[level](`API ${method} ${url} ${statusCode}`, {
            type: 'api_request',
            method,
            url,
            statusCode,
            duration,
            ...metadata
        });
    }

    /**
     * Get logger statistics
     */
    getStats() {
        return {
            sessionId: this.sessionId,
            correlationId: this.correlationId,
            userId: this.userId,
            bufferSize: this.logBuffer.length,
            transports: this.transports.length,
            config: this.config
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        
        // Flush any remaining logs
        this.flushLogs();
    }
}

// Create default logger instance
const defaultLogger = new UnifiedLogger({
    level: typeof window !== 'undefined' ? 
        (window.location.hostname === 'localhost' ? 'debug' : 'info') : 
        (process.env.LOG_LEVEL || 'info'),
    enableConsole: true,
    enableFile: typeof window === 'undefined',
    enableRemote: typeof window !== 'undefined' ? false : process.env.NODE_ENV === 'production',
    remoteEndpoint: typeof window !== 'undefined' ? null : process.env.LOG_REMOTE_ENDPOINT,
    apiKey: typeof window !== 'undefined' ? null : process.env.LOG_API_KEY,
    sanitizePII: true
});

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/Backend
    module.exports = defaultLogger;
    module.exports.UnifiedLogger = UnifiedLogger;
} else if (typeof window !== 'undefined') {
    // Browser/Frontend
    window.CoinDropLogger = defaultLogger;
    window.UnifiedLogger = UnifiedLogger;
}
