/**
 * Performance Service
 * 
 * Provides performance testing, monitoring, and optimization
 * capabilities for enterprise-grade performance management.
 * 
 * @module services/performanceService
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

/**
 * Performance configuration
 */
const PERFORMANCE_CONFIG = {
    monitoringEnabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
    metricsRetentionDays: parseInt(process.env.PERFORMANCE_RETENTION_DAYS) || 30,
    alertThresholds: {
        responseTime: parseInt(process.env.ALERT_RESPONSE_TIME) || 1000, // ms
        errorRate: parseFloat(process.env.ALERT_ERROR_RATE) || 0.05, // 5%
        cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE) || 80, // 80%
        memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE) || 85, // 85%
    },
    samplingRate: parseFloat(process.env.PERFORMANCE_SAMPLING_RATE) || 1.0,
};

/**
 * Performance metrics schema
 */
const PerformanceMetricSchema = new mongoose.Schema({
    operation: {
        type: String,
        required: true,
        index: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
    },
    success: {
        type: Boolean,
        default: true,
    },
    error: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes
PerformanceMetricSchema.index({ operation: 1, timestamp: -1 });
PerformanceMetricSchema.index({ timestamp: -1 });

const PerformanceMetric = mongoose.model('PerformanceMetric', PerformanceMetricSchema);

/**
 * Performance Service class
 */
class PerformanceService extends EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.alertHistory = [];
        this.baselineMetrics = new Map();
    }

    /**
     * Initialize performance service
     */
    async initialize() {
        try {
            logger.info('Initializing performance service');

            if (PERFORMANCE_CONFIG.monitoringEnabled) {
                this.startMonitoring();
            }

            logger.info('Performance service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize performance service:', error);
            throw error;
        }
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;

        // Monitor system metrics every 30 seconds
        this.monitoringInterval = setInterval(
            () => this.collectSystemMetrics(),
            30000
        );

        logger.info('Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        logger.info('Performance monitoring stopped');
    }

    /**
     * Collect system metrics
     */
    async collectSystemMetrics() {
        try {
            const metrics = {
                timestamp: new Date(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime(),
            };

            // Check thresholds and emit alerts
            this.checkThresholds(metrics);

            // Store metrics
            await this.storeMetric('system', 0, {
                memory: metrics.memory,
                cpu: metrics.cpu,
                uptime: metrics.uptime,
            });
        } catch (error) {
            logger.error('Failed to collect system metrics:', error);
        }
    }

    /**
     * Check metric thresholds
     */
    checkThresholds(metrics) {
        const alerts = [];

        // Check memory usage
        const memoryPercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
        if (memoryPercent > PERFORMANCE_CONFIG.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory',
                severity: 'warning',
                message: `High memory usage: ${memoryPercent.toFixed(2)}%`,
                value: memoryPercent,
                threshold: PERFORMANCE_CONFIG.alertThresholds.memoryUsage,
            });
        }

        // Emit alerts
        alerts.forEach(alert => {
            this.emit('alert', alert);
            this.alertHistory.push({
                ...alert,
                timestamp: new Date(),
            });
        });
    }

    /**
     * Measure operation performance
     */
    async measureOperation(operationName, operation, metadata = {}) {
        const startTime = process.hrtime.bigint();
        let success = true;
        let error = null;

        try {
            const result = await operation();
            return result;
        } catch (err) {
            success = false;
            error = err.message;
            throw err;
        } finally {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

            // Store metric
            await this.storeMetric(operationName, duration, {
                ...metadata,
                success,
                error,
            });

            // Check if duration exceeds threshold
            if (duration > PERFORMANCE_CONFIG.alertThresholds.responseTime) {
                this.emit('alert', {
                    type: 'performance',
                    severity: 'warning',
                    message: `Slow operation: ${operationName} took ${duration.toFixed(2)}ms`,
                    operation: operationName,
                    duration,
                    threshold: PERFORMANCE_CONFIG.alertThresholds.responseTime,
                });
            }
        }
    }

    /**
     * Store performance metric
     */
    async storeMetric(operation, duration, metadata = {}) {
        try {
            // Skip if sampling rate is less than 1
            if (Math.random() > PERFORMANCE_CONFIG.samplingRate) {
                return;
            }

            const metric = new PerformanceMetric({
                operation,
                duration,
                metadata,
                success: metadata.success !== false,
                error: metadata.error || null,
            });

            await metric.save();
        } catch (error) {
            logger.error('Failed to store performance metric:', error);
        }
    }

    /**
     * Get performance statistics
     */
    async getStats(timeRange = {}) {
        try {
            const matchStage = {};
            
            if (timeRange.start || timeRange.end) {
                matchStage.timestamp = {};
                if (timeRange.start) {
                    matchStage.timestamp.$gte = new Date(timeRange.start);
                }
                if (timeRange.end) {
                    matchStage.timestamp.$lte = new Date(timeRange.end);
                }
            }

            const stats = await PerformanceMetric.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$operation',
                        count: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        minDuration: { $min: '$duration' },
                        maxDuration: { $max: '$duration' },
                        p95Duration: {
                            $percentile: {
                                p: [0.95],
                                input: '$duration',
                            },
                        },
                        p99Duration: {
                            $percentile: {
                                p: [0.99],
                                input: '$duration',
                            },
                        },
                        successCount: {
                            $sum: { $cond: ['$success', 1, 0] },
                        },
                        failureCount: {
                            $sum: { $cond: ['$success', 0, 1] },
                        },
                    },
                },
                {
                    $project: {
                        operation: '$_id',
                        count: 1,
                        avgDuration: { $round: ['$avgDuration', 2] },
                        minDuration: { $round: ['$minDuration', 2] },
                        maxDuration: { $round: ['$maxDuration', 2] },
                        p95Duration: { $round: [{ $arrayElemAt: ['$p95Duration', 0] }, 2] },
                        p99Duration: { $round: [{ $arrayElemAt: ['$p99Duration', 0] }, 2] },
                        successCount: 1,
                        failureCount: 1,
                        successRate: {
                            $round: [
                                { $multiply: [{ $divide: ['$successCount', '$count'] }, 100] },
                                2,
                            ],
                        },
                    },
                },
                { $sort: { count: -1 } },
            ]);

            return stats;
        } catch (error) {
            logger.error('Failed to get performance stats:', error);
            return [];
        }
    }

    /**
     * Get performance trends
     */
    async getTrends(operation, timeRange = {}, interval = '1h') {
        try {
            const matchStage = { operation };
            
            if (timeRange.start || timeRange.end) {
                matchStage.timestamp = {};
                if (timeRange.start) {
                    matchStage.timestamp.$gte = new Date(timeRange.start);
                }
                if (timeRange.end) {
                    matchStage.timestamp.$lte = new Date(timeRange.end);
                }
            }

            const intervalMs = this.parseInterval(interval);

            const trends = await PerformanceMetric.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            $subtract: [
                                '$timestamp',
                                { $mod: [{ $toLong: '$timestamp' }, intervalMs] },
                            ],
                        },
                        count: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        minDuration: { $min: '$duration' },
                        maxDuration: { $max: '$duration' },
                        successCount: {
                            $sum: { $cond: ['$success', 1, 0] },
                        },
                    },
                },
                {
                    $project: {
                        timestamp: '$_id',
                        count: 1,
                        avgDuration: { $round: ['$avgDuration', 2] },
                        minDuration: { $round: ['$minDuration', 2] },
                        maxDuration: { $round: ['$maxDuration', 2] },
                        successRate: {
                            $round: [
                                { $multiply: [{ $divide: ['$successCount', '$count'] }, 100] },
                                2,
                            ],
                        },
                    },
                },
                { $sort: { timestamp: 1 } },
            ]);

            return trends;
        } catch (error) {
            logger.error('Failed to get performance trends:', error);
            return [];
        }
    }

    /**
     * Parse interval string to milliseconds
     */
    parseInterval(interval) {
        const units = {
            ms: 1,
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };

        const match = interval.match(/^(\d+)(ms|s|m|h|d)$/);
        if (!match) {
            return 60 * 60 * 1000; // Default to 1 hour
        }

        return parseInt(match[1]) * units[match[2]];
    }

    /**
     * Set baseline metrics
     */
    setBaseline(operation, metrics) {
        this.baselineMetrics.set(operation, {
            ...metrics,
            timestamp: new Date(),
        });
    }

    /**
     * Compare current metrics with baseline
     */
    compareWithBaseline(operation, currentMetrics) {
        const baseline = this.baselineMetrics.get(operation);
        
        if (!baseline) {
            return null;
        }

        return {
            operation,
            avgDuration: {
                current: currentMetrics.avgDuration,
                baseline: baseline.avgDuration,
                change: ((currentMetrics.avgDuration - baseline.avgDuration) / baseline.avgDuration) * 100,
            },
            successRate: {
                current: currentMetrics.successRate,
                baseline: baseline.successRate,
                change: currentMetrics.successRate - baseline.successRate,
            },
        };
    }

    /**
     * Run load test
     */
    async runLoadTest(config) {
        const {
            operation,
            concurrency = 10,
            duration = 60,
            rampUp = 10,
        } = config;

        logger.info(`Starting load test: ${operation}`, { concurrency, duration, rampUp });

        const results = {
            operation,
            startTime: new Date(),
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: [],
        };

        const endTime = Date.now() + (duration * 1000);
        const rampUpEnd = Date.now() + (rampUp * 1000);

        const workers = [];

        // Create workers
        for (let i = 0; i < concurrency; i++) {
            workers.push(this.loadTestWorker(operation, endTime, rampUpEnd, results));
        }

        // Wait for all workers to complete
        await Promise.all(workers);

        results.endTime = new Date();
        results.duration = (results.endTime - results.startTime) / 1000;

        // Calculate statistics
        if (results.responseTimes.length > 0) {
            results.avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
            results.minResponseTime = Math.min(...results.responseTimes);
            results.maxResponseTime = Math.max(...results.responseTimes);
            
            // Calculate percentiles
            const sorted = [...results.responseTimes].sort((a, b) => a - b);
            results.p50 = sorted[Math.floor(sorted.length * 0.5)];
            results.p95 = sorted[Math.floor(sorted.length * 0.95)];
            results.p99 = sorted[Math.floor(sorted.length * 0.99)];
        }

        results.throughput = results.totalRequests / results.duration;
        results.errorRate = (results.failedRequests / results.totalRequests) * 100;

        logger.info('Load test completed', {
            operation,
            totalRequests: results.totalRequests,
            avgResponseTime: results.avgResponseTime,
            errorRate: results.errorRate,
        });

        return results;
    }

    /**
     * Load test worker
     */
    async loadTestWorker(operation, endTime, rampUpEnd, results) {
        while (Date.now() < endTime) {
            // Ramp up delay
            if (Date.now() < rampUpEnd) {
                await this.delay(Math.random() * 100);
            }

            const startTime = Date.now();

            try {
                // Execute operation
                await operation();
                
                results.responseTimes.push(Date.now() - startTime);
                results.successfulRequests++;
            } catch (error) {
                results.errors.push({
                    timestamp: new Date(),
                    error: error.message,
                });
                results.failedRequests++;
            }

            results.totalRequests++;
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit = 100) {
        return this.alertHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Clear alert history
     */
    clearAlertHistory() {
        this.alertHistory = [];
    }

    /**
     * Clean up old metrics
     */
    async cleanupOldMetrics() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - PERFORMANCE_CONFIG.metricsRetentionDays);

            const result = await PerformanceMetric.deleteMany({
                timestamp: { $lt: cutoffDate },
            });

            logger.info(`Cleaned up ${result.deletedCount} old performance metrics`);
            return result.deletedCount;
        } catch (error) {
            logger.error('Failed to cleanup old metrics:', error);
            return 0;
        }
    }

    /**
     * Generate performance report
     */
    async generateReport(timeRange = {}) {
        try {
            const stats = await this.getStats(timeRange);
            const alerts = this.getAlertHistory(50);

            return {
                generatedAt: new Date(),
                timeRange,
                summary: {
                    totalOperations: stats.length,
                    totalRequests: stats.reduce((sum, s) => sum + s.count, 0),
                    avgResponseTime: stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length,
                    overallSuccessRate: stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length,
                },
                operations: stats,
                alerts,
                configuration: PERFORMANCE_CONFIG,
            };
        } catch (error) {
            logger.error('Failed to generate performance report:', error);
            return null;
        }
    }

    /**
     * Shutdown service
     */
    async shutdown() {
        this.stopMonitoring();
        logger.info('Performance service shutdown');
    }
}

// Export singleton instance
module.exports = new PerformanceService();
