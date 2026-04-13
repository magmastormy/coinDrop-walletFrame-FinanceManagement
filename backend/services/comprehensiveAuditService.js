/**
 * Comprehensive Audit Service
 * 
 * Extends audit logging to cover all system operations with
 * automatic audit trail generation for all CRUD operations.
 * 
 * @module services/comprehensiveAuditService
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const auditIntegrityService = require('./auditIntegrityService');

/**
 * Audit configuration
 */
const AUDIT_CONFIG = {
    enabled: process.env.COMPREHENSIVE_AUDIT_ENABLED !== 'false',
    logSystemEvents: true,
    logUserActions: true,
    logDataChanges: true,
    logAuthenticationEvents: true,
    logSecurityEvents: true,
    logPerformanceMetrics: true,
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555, // 7 years
    batchSize: 100,
    flushInterval: 5000, // 5 seconds
};

/**
 * Comprehensive Audit Service class
 */
class ComprehensiveAuditService {
    constructor() {
        this.auditQueue = [];
        this.flushTimer = null;
        this.isInitialized = false;
        this.auditLogModel = null;
    }

    /**
     * Initialize comprehensive audit service
     */
    async initialize() {
        try {
            logger.info('Initializing comprehensive audit service');

            // Get AuditLog model
            this.auditLogModel = mongoose.model('AuditLog');

            // Start automatic flush
            this.startAutomaticFlush();

            // Setup mongoose middleware for automatic auditing
            this.setupMongooseMiddleware();

            this.isInitialized = true;
            logger.info('Comprehensive audit service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize comprehensive audit service:', error);
            throw error;
        }
    }

    /**
     * Setup mongoose middleware for automatic auditing
     */
    setupMongooseMiddleware() {
        if (!AUDIT_CONFIG.enabled) {
            return;
        }

        // Add middleware to all models
        const models = mongoose.models;
        
        Object.keys(models).forEach(modelName => {
            const model = models[modelName];
            
            // Skip AuditLog and AuditBlock models
            if (modelName === 'AuditLog' || modelName === 'AuditBlock') {
                return;
            }

            this.setupModelMiddleware(model, modelName);
        });

        logger.info('Mongoose middleware setup completed');
    }

    /**
     * Setup middleware for specific model
     */
    setupModelMiddleware(model, modelName) {
        // Pre-save middleware
        model.pre('save', async function(next) {
            if (this.isNew) {
                this._auditAction = 'CREATE';
            } else {
                this._auditAction = 'UPDATE';
                this._auditOriginal = this.toObject({ getters: false, virtuals: false });
            }
            next();
        });

        // Post-save middleware
        model.post('save', async function(doc) {
            try {
                await comprehensiveAuditService.logDataChange({
                    action: doc._auditAction || 'UPDATE',
                    entityType: modelName,
                    entityId: doc._id,
                    changes: doc._auditAction === 'UPDATE' 
                        ? comprehensiveAuditService.calculateChanges(doc._auditOriginal, doc.toObject())
                        : doc.toObject(),
                    metadata: {
                        isNew: doc._auditAction === 'CREATE',
                    },
                });
            } catch (error) {
                logger.error(`Failed to audit ${modelName} save:`, error);
            }
        });

        // Pre-remove middleware
        model.pre('remove', async function(next) {
            this._auditOriginal = this.toObject({ getters: false, virtuals: false });
            next();
        });

        // Post-remove middleware
        model.post('remove', async function(doc) {
            try {
                await comprehensiveAuditService.logDataChange({
                    action: 'DELETE',
                    entityType: modelName,
                    entityId: doc._id,
                    changes: doc._auditOriginal,
                    metadata: {
                        deleted: true,
                    },
                });
            } catch (error) {
                logger.error(`Failed to audit ${modelName} remove:`, error);
            }
        });

        // Pre-updateOne and updateMany middleware
        model.pre(['updateOne', 'updateMany'], async function(next) {
            try {
                // Store original documents
                const docs = await this.model.find(this.getQuery()).lean();
                this._auditOriginals = docs;
                this._auditAction = this.op === 'updateOne' ? 'UPDATE' : 'BULK_UPDATE';
                next();
            } catch (error) {
                next(error);
            }
        });

        // Post-updateOne and updateMany middleware
        model.post(['updateOne', 'updateMany'], async function(result) {
            try {
                const updateData = this.getUpdate();
                
                for (const original of (this._auditOriginals || [])) {
                    await comprehensiveAuditService.logDataChange({
                        action: this._auditAction || 'UPDATE',
                        entityType: modelName,
                        entityId: original._id,
                        changes: {
                            before: original,
                            after: { ...original, ...updateData },
                        },
                        metadata: {
                            updateType: 'query',
                        },
                    });
                }
            } catch (error) {
                logger.error(`Failed to audit ${modelName} update:`, error);
            }
        });

        // Pre-deleteOne and deleteMany middleware
        model.pre(['deleteOne', 'deleteMany'], async function(next) {
            try {
                const docs = await this.model.find(this.getQuery()).lean();
                this._auditOriginals = docs;
                this._auditAction = this.op === 'deleteOne' ? 'DELETE' : 'BULK_DELETE';
                next();
            } catch (error) {
                next(error);
            }
        });

        // Post-deleteOne and deleteMany middleware
        model.post(['deleteOne', 'deleteMany'], async function(result) {
            try {
                for (const original of (this._auditOriginals || [])) {
                    await comprehensiveAuditService.logDataChange({
                        action: this._auditAction || 'DELETE',
                        entityType: modelName,
                        entityId: original._id,
                        changes: original,
                        metadata: {
                            deleted: true,
                            deleteType: 'query',
                        },
                    });
                }
            } catch (error) {
                logger.error(`Failed to audit ${modelName} delete:`, error);
            }
        });
    }

    /**
     * Calculate changes between original and updated document
     */
    calculateChanges(original, updated) {
        const changes = {
            before: {},
            after: {},
        };

        const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)]);

        for (const key of allKeys) {
            // Skip internal fields
            if (key.startsWith('_') || key === 'id') {
                continue;
            }

            const originalValue = original[key];
            const updatedValue = updated[key];

            if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
                changes.before[key] = originalValue;
                changes.after[key] = updatedValue;
            }
        }

        return changes;
    }

    /**
     * Log data change
     */
    async logDataChange(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logDataChanges) {
            return;
        }

        const auditEntry = {
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            changes: data.changes,
            metadata: {
                ...data.metadata,
                auditType: 'data_change',
            },
            timestamp: new Date(),
            status: 'success',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Log user action
     */
    async logUserAction(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logUserActions) {
            return;
        }

        const auditEntry = {
            adminId: data.userId,
            action: data.action,
            entityType: data.entityType || 'user_action',
            entityId: data.entityId,
            changes: data.details,
            metadata: {
                ...data.metadata,
                auditType: 'user_action',
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
            timestamp: new Date(),
            status: data.status || 'success',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Log authentication event
     */
    async logAuthenticationEvent(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logAuthenticationEvents) {
            return;
        }

        const auditEntry = {
            adminId: data.userId,
            action: `AUTH_${data.event}`,
            entityType: 'authentication',
            entityId: data.userId,
            changes: {
                event: data.event,
                method: data.method,
                success: data.success,
            },
            metadata: {
                ...data.metadata,
                auditType: 'authentication',
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                failureReason: data.failureReason,
            },
            timestamp: new Date(),
            status: data.success ? 'success' : 'failure',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Log security event
     */
    async logSecurityEvent(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logSecurityEvents) {
            return;
        }

        const auditEntry = {
            adminId: data.userId,
            action: `SECURITY_${data.event}`,
            entityType: 'security',
            entityId: data.entityId || data.userId,
            changes: data.details,
            metadata: {
                ...data.metadata,
                auditType: 'security',
                severity: data.severity || 'info',
                ipAddress: data.ipAddress,
            },
            timestamp: new Date(),
            status: data.status || 'success',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Log system event
     */
    async logSystemEvent(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logSystemEvents) {
            return;
        }

        const auditEntry = {
            action: `SYSTEM_${data.event}`,
            entityType: 'system',
            entityId: data.component,
            changes: data.details,
            metadata: {
                ...data.metadata,
                auditType: 'system',
                component: data.component,
                severity: data.severity || 'info',
            },
            timestamp: new Date(),
            status: data.status || 'success',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Log performance metric
     */
    async logPerformanceMetric(data) {
        if (!AUDIT_CONFIG.enabled || !AUDIT_CONFIG.logPerformanceMetrics) {
            return;
        }

        const auditEntry = {
            action: 'PERFORMANCE_METRIC',
            entityType: 'performance',
            entityId: data.operation,
            changes: {
                duration: data.duration,
                threshold: data.threshold,
            },
            metadata: {
                ...data.metadata,
                auditType: 'performance',
                operation: data.operation,
                exceeded: data.duration > data.threshold,
            },
            timestamp: new Date(),
            status: data.duration > data.threshold ? 'warning' : 'success',
        };

        await this.queueAuditEntry(auditEntry);
    }

    /**
     * Queue audit entry for batch processing
     */
    async queueAuditEntry(entry) {
        this.auditQueue.push(entry);

        // Flush if batch size reached
        if (this.auditQueue.length >= AUDIT_CONFIG.batchSize) {
            await this.flushAuditQueue();
        }
    }

    /**
     * Start automatic flush timer
     */
    startAutomaticFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(
            () => this.flushAuditQueue(),
            AUDIT_CONFIG.flushInterval
        );
    }

    /**
     * Stop automatic flush timer
     */
    stopAutomaticFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Flush audit queue to database
     */
    async flushAuditQueue() {
        if (this.auditQueue.length === 0) {
            return;
        }

        const entries = [...this.auditQueue];
        this.auditQueue = [];

        try {
            // Insert entries
            const result = await this.auditLogModel.insertMany(entries, { ordered: false });

            // Add to integrity service
            for (const entry of result) {
                await auditIntegrityService.addAuditLog(entry);
            }

            logger.debug(`Flushed ${result.length} audit entries`);
        } catch (error) {
            logger.error('Failed to flush audit queue:', error);
            // Re-queue failed entries
            this.auditQueue.unshift(...entries);
        }
    }

    /**
     * Get audit statistics
     */
    async getAuditStats(timeRange = {}) {
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

            const stats = await this.auditLogModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalEntries: { $sum: 1 },
                        actions: { $addToSet: '$action' },
                        entityTypes: { $addToSet: '$entityType' },
                        successCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
                        },
                        failureCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
                        },
                    },
                },
            ]);

            return stats[0] || {
                totalEntries: 0,
                actions: [],
                entityTypes: [],
                successCount: 0,
                failureCount: 0,
            };
        } catch (error) {
            logger.error('Failed to get audit stats:', error);
            return null;
        }
    }

    /**
     * Search audit logs
     */
    async searchAuditLogs(query = {}, options = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                sort = { timestamp: -1 },
            } = options;

            const skip = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                this.auditLogModel
                    .find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.auditLogModel.countDocuments(query),
            ]);

            return {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Failed to search audit logs:', error);
            return { logs: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
        }
    }

    /**
     * Get audit trail for specific entity
     */
    async getEntityAuditTrail(entityType, entityId, options = {}) {
        try {
            const query = {
                entityType,
                entityId: mongoose.Types.ObjectId.isValid(entityId) 
                    ? new mongoose.Types.ObjectId(entityId)
                    : entityId,
            };

            return await this.searchAuditLogs(query, options);
        } catch (error) {
            logger.error('Failed to get entity audit trail:', error);
            return { logs: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
        }
    }

    /**
     * Get user activity audit trail
     */
    async getUserAuditTrail(userId, options = {}) {
        try {
            const query = {
                adminId: mongoose.Types.ObjectId.isValid(userId)
                    ? new mongoose.Types.ObjectId(userId)
                    : userId,
            };

            return await this.searchAuditLogs(query, options);
        } catch (error) {
            logger.error('Failed to get user audit trail:', error);
            return { logs: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
        }
    }

    /**
     * Clean up old audit logs
     */
    async cleanupOldLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - AUDIT_CONFIG.retentionDays);

            const result = await this.auditLogModel.deleteMany({
                timestamp: { $lt: cutoffDate },
            });

            logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
            return result.deletedCount;
        } catch (error) {
            logger.error('Failed to cleanup old audit logs:', error);
            return 0;
        }
    }

    /**
     * Export audit logs
     */
    async exportAuditLogs(query = {}, format = 'json') {
        try {
            const logs = await this.auditLogModel
                .find(query)
                .sort({ timestamp: -1 })
                .lean();

            if (format === 'csv') {
                return this.convertToCSV(logs);
            }

            return JSON.stringify(logs, null, 2);
        } catch (error) {
            logger.error('Failed to export audit logs:', error);
            return null;
        }
    }

    /**
     * Convert logs to CSV format
     */
    convertToCSV(logs) {
        if (logs.length === 0) {
            return '';
        }

        const headers = [
            'timestamp',
            'action',
            'entityType',
            'entityId',
            'adminId',
            'status',
            'ipAddress',
        ];

        const rows = logs.map(log => [
            log.timestamp,
            log.action,
            log.entityType,
            log.entityId,
            log.adminId,
            log.status,
            log.metadata?.ipAddress || '',
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Shutdown service
     */
    async shutdown() {
        this.stopAutomaticFlush();
        await this.flushAuditQueue();
        logger.info('Comprehensive audit service shutdown');
    }
}

// Create singleton instance
const comprehensiveAuditService = new ComprehensiveAuditService();

module.exports = comprehensiveAuditService;
