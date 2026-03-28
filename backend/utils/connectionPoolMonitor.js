const mongoose = require('mongoose');
const logger = require('./logger');

class ConnectionPoolMonitor {
    constructor() {
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            availableConnections: 0,
            pendingRequests: 0,
            connectionErrors: 0,
            lastChecked: null,
            history: []
        };
        
        this.historySize = 100; // Keep last 100 data points
        this.checkInterval = null;
    }

    /**
     * Start monitoring MongoDB connection pool
     */
    start(intervalMs = 5000) {
        if (this.checkInterval) {
            logger.warn('Connection pool monitoring already running');
            return;
        }

        logger.info('Starting MongoDB connection pool monitoring...');
        
        this.checkInterval = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.info('MongoDB connection pool monitoring stopped');
        }
    }

    /**
     * Collect current pool metrics
     */
    collectMetrics() {
        try {
            const conn = mongoose.connection;
            
            if (!conn) {
                logger.warn('No MongoDB connection available');
                return;
            }

            const metrics = {
                timestamp: new Date().toISOString(),
                totalConnections: conn.totalConnections || 0,
                activeConnections: conn.activeConnections || 0,
                availableConnections: conn.availableConnections || 0,
                pendingRequests: conn.pendingRequests || 0,
                readyState: conn.readyState,
                host: conn.host,
                port: conn.port,
                name: conn.name
            };

            // Update current metrics
            this.metrics = {
                ...metrics,
                connectionErrors: this.metrics.connectionErrors,
                history: [
                    ...this.metrics.history.slice(-this.historySize + 1),
                    metrics
                ]
            };

            // Log warnings for high connection usage
            if (metrics.activeConnections > 80 && metrics.totalConnections > 0) {
                const usagePercent = (metrics.activeConnections / metrics.totalConnections) * 100;
                logger.warn(`High connection pool usage: ${usagePercent.toFixed(1)}%`);
            }

            // Track connection errors
            if (metrics.readyState === 0 || metrics.readyState === 3) {
                this.metrics.connectionErrors++;
                logger.error('MongoDB connection lost or disconnected');
            }

        } catch (error) {
            logger.error('Error collecting connection pool metrics:', error.message);
            this.metrics.connectionErrors++;
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Get metrics history
     */
    getHistory(limit = 50) {
        return this.metrics.history.slice(-limit);
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            availableConnections: 0,
            pendingRequests: 0,
            connectionErrors: 0,
            lastChecked: null,
            history: []
        };
    }
}

module.exports = new ConnectionPoolMonitor();
