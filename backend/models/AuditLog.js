const logger = require('../utils/logger');

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Admin ID is required']
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: {
            values: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'SYSTEM_CONFIG'],
            message: 'Action must be one of: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT, SYSTEM_CONFIG'
        }
    },
    entityType: {
        type: String,
        required: [true, 'Entity type is required'],
        enum: {
            values: ['USER', 'TRANSACTION', 'CATEGORY', 'WALLET', 'BUDGET', 'SYSTEM'],
            message: 'Entity type must be one of: USER, TRANSACTION, CATEGORY, WALLET, BUDGET, SYSTEM'
        }
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null
    },
    changes: {
        type: {
            before: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            after: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            }
        },
        required: false,
        default: null
    },
    metadata: {
        type: {
            ipAddress: {
                type: String,
                default: null
            },
            userAgent: {
                type: String,
                default: null
            },
            location: {
                type: String,
                default: null
            },
            sessionId: {
                type: String,
                default: null
            },
            requestId: {
                type: String,
                default: null
            },
            additionalInfo: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            }
        },
        required: false,
        default: () => ({})
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ['SUCCESS', 'FAILED'],
            message: 'Status must be either SUCCESS or FAILED'
        },
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String,
        required: false,
        default: null
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// Indexes for Performance
// ============================================

// Index for querying by admin
AuditLogSchema.index({ adminId: 1 });

// Compound index for querying by entity type and entity ID
AuditLogSchema.index({ entityType: 1, entityId: 1 });

// Index for timestamp-based queries (descending for recent first)
AuditLogSchema.index({ timestamp: -1 });

// Index for action-based filtering
AuditLogSchema.index({ action: 1 });

// Compound index for admin-specific time-based queries
AuditLogSchema.index({ adminId: 1, timestamp: -1 });

// Compound index for status-based queries with timestamp
AuditLogSchema.index({ status: 1, timestamp: -1 });

// Compound index for entity queries with timestamp
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

// TTL index to automatically delete audit logs after 1 year (365 days)
// This helps manage database size while maintaining compliance
AuditLogSchema.index(
    { timestamp: 1 },
    {
        expireAfterSeconds: 31536000, // 365 days in seconds
        name: 'audit_log_ttl_index'
    }
);

// ============================================
// Schema Methods (Instance Methods)
// ============================================

/**
 * Find audit logs by admin with pagination support
 * @param {string} adminId - The admin ID to query by
 * @param {Object} options - Query options (limit, skip, sort, etc.)
 * @returns {Promise<Array>} Array of audit log documents
 */
AuditLogSchema.methods.findByAdmin = async function(adminId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { timestamp: -1 },
        startDate,
        endDate,
        action,
        status
    } = options;

    const query = { adminId };

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) query.action = action;
    if (status) query.status = status;

    return this.model('AuditLog')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'username email firstName lastName')
        .lean();
};

/**
 * Find audit logs by entity type and entity ID
 * @param {string} entityType - The type of entity
 * @param {string} entityId - The entity ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of audit log documents
 */
AuditLogSchema.methods.findByEntity = async function(entityType, entityId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { timestamp: -1 }
    } = options;

    const query = { entityType };
    if (entityId) query.entityId = entityId;

    return this.model('AuditLog')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'username email firstName lastName')
        .lean();
};

/**
 * Find audit logs within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of audit log documents
 */
AuditLogSchema.methods.findByDateRange = async function(startDate, endDate, options = {}) {
    const {
        limit = 100,
        skip = 0,
        sort = { timestamp: -1 },
        adminId,
        action,
        entityType
    } = options;

    const query = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    return this.model('AuditLog')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'username email firstName lastName')
        .lean();
};

// ============================================
// Static Methods
// ============================================

/**
 * Get audit trail for a specific entity
 * @param {string} entityType - The type of entity
 * @param {string} entityId - The entity ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Audit trail with timeline and summary
 */
AuditLogSchema.statics.getAuditTrail = async function(entityType, entityId, options = {}) {
    const {
        limit = 100,
        skip = 0,
        includeRelated = false,
        startDate,
        endDate
    } = options;

    const query = { entityType };

    if (entityId) {
        query.entityId = new mongoose.Types.ObjectId(entityId);
    }

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get the audit trail
    const auditLogs = await this.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'username email firstName lastName role')
        .lean();

    // Get summary statistics
    const summary = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                firstOccurrence: { $min: '$timestamp' },
                lastOccurrence: { $max: '$timestamp' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Get unique admins who performed actions
    const uniqueAdmins = await this.distinct('adminId', query);

    // Get related entities if requested
    let relatedEntities = [];
    if (includeRelated && auditLogs.length > 0) {
        const adminIds = [...new Set(auditLogs.map(log => log.adminId?._id?.toString()).filter(Boolean))];
        relatedEntities = await this.find({
            adminId: { $in: adminIds.map(id => new mongoose.Types.ObjectId(id)) },
            entityId: { $ne: new mongoose.Types.ObjectId(entityId) }
        })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('adminId', 'username email')
        .lean();
    }

    // Build timeline
    const timeline = auditLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        admin: log.adminId,
        status: log.status,
        changes: log.changes,
        metadata: log.metadata
    }));

    return {
        entityType,
        entityId,
        summary: {
            totalActions: auditLogs.length,
            actionBreakdown: summary.reduce((acc, item) => {
                acc[item._id] = {
                    count: item.count,
                    firstOccurrence: item.firstOccurrence,
                    lastOccurrence: item.lastOccurrence
                };
                return acc;
            }, {}),
            uniqueAdminsCount: uniqueAdmins.length,
            firstActivity: auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].timestamp : null,
            lastActivity: auditLogs.length > 0 ? auditLogs[0].timestamp : null
        },
        timeline,
        relatedEntities: includeRelated ? relatedEntities : undefined,
        generatedAt: new Date()
    };
};

/**
 * Create a new audit log entry
 * @param {Object} data - The audit log data
 * @param {string} data.adminId - Admin ID performing the action
 * @param {string} data.action - Action type
 * @param {string} data.entityType - Type of entity affected
 * @param {string} [data.entityId] - ID of entity affected
 * @param {Object} [data.changes] - Before/after changes
 * @param {Object} [data.metadata] - Additional metadata (IP, user agent, etc.)
 * @param {string} [data.status] - Status of the action
 * @param {string} [data.errorMessage] - Error message if failed
 * @returns {Promise<Object>} Created audit log document
 */
AuditLogSchema.statics.logAction = async function(data) {
    try {
        const auditLog = new this({
            adminId: data.adminId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId || null,
            changes: data.changes || null,
            metadata: {
                ipAddress: data.metadata?.ipAddress || null,
                userAgent: data.metadata?.userAgent || null,
                location: data.metadata?.location || null,
                sessionId: data.metadata?.sessionId || null,
                requestId: data.metadata?.requestId || null,
                additionalInfo: data.metadata?.additionalInfo || null
            },
            status: data.status || 'SUCCESS',
            errorMessage: data.errorMessage || null,
            timestamp: data.timestamp || new Date()
        });

        return await auditLog.save();
    } catch (error) {
        logger.error('Error creating audit log:', error);
        // Don't throw - audit logging should not break the main flow
        return null;
    }
};

/**
 * Get recent audit logs
 * @param {number} limit - Number of logs to retrieve
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of recent audit logs
 */
AuditLogSchema.statics.getRecentLogs = async function(limit = 50, filters = {}) {
    const query = {};

    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.status) query.status = filters.status;

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminId', 'username email firstName lastName role')
        .populate('entityId')
        .lean();
};

/**
 * Get action statistics within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Statistics object
 */
AuditLogSchema.statics.getActionStats = async function(startDate, endDate, options = {}) {
    const matchStage = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (options.adminId) matchStage.adminId = new mongoose.Types.ObjectId(options.adminId);
    if (options.entityType) matchStage.entityType = options.entityType;

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                successful: {
                    $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
                }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const entityStats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$entityType',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const dailyStats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalSuccessful = stats.reduce((sum, stat) => sum + stat.successful, 0);
    const totalFailed = stats.reduce((sum, stat) => sum + stat.failed, 0);

    return {
        summary: {
            totalActions: totalCount,
            successfulActions: totalSuccessful,
            failedActions: totalFailed,
            successRate: totalCount > 0 ? ((totalSuccessful / totalCount) * 100).toFixed(2) : 0
        },
        actionBreakdown: stats.reduce((acc, stat) => {
            acc[stat._id] = {
                total: stat.count,
                successful: stat.successful,
                failed: stat.failed
            };
            return acc;
        }, {}),
        entityBreakdown: entityStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {}),
        dailyTrend: dailyStats.map(day => ({
            date: day._id,
            count: day.count
        }))
    };
};

/**
 * Get admin activity summary
 * @param {string} adminId - Admin ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Admin activity summary
 */
AuditLogSchema.statics.getAdminActivitySummary = async function(adminId, options = {}) {
    const { startDate, endDate } = options;

    const matchStage = { adminId: new mongoose.Types.ObjectId(adminId) };

    if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const actionCounts = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        }
    ]);

    const entityCounts = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$entityType',
                count: { $sum: 1 }
            }
        }
    ]);

    const statusCounts = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const lastActivity = await this.findOne({ adminId })
        .sort({ timestamp: -1 })
        .select('timestamp action entityType')
        .lean();

    return {
        adminId,
        totalActions: actionCounts.reduce((sum, a) => sum + a.count, 0),
        actionDistribution: actionCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        entityDistribution: entityCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        statusDistribution: statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        lastActivity: lastActivity || null
    };
};

/**
 * Search audit logs with multiple criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Matching audit logs
 */
AuditLogSchema.statics.searchLogs = async function(criteria = {}, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { timestamp: -1 }
    } = options;

    const query = {};

    if (criteria.adminId) query.adminId = criteria.adminId;
    if (criteria.action) query.action = criteria.action;
    if (criteria.entityType) query.entityType = criteria.entityType;
    if (criteria.entityId) query.entityId = criteria.entityId;
    if (criteria.status) query.status = criteria.status;

    if (criteria.startDate || criteria.endDate) {
        query.timestamp = {};
        if (criteria.startDate) query.timestamp.$gte = new Date(criteria.startDate);
        if (criteria.endDate) query.timestamp.$lte = new Date(criteria.endDate);
    }

    if (criteria.ipAddress) {
        query['metadata.ipAddress'] = criteria.ipAddress;
    }

    if (criteria.searchTerm) {
        query.$or = [
            { errorMessage: { $regex: criteria.searchTerm, $options: 'i' } },
            { 'metadata.additionalInfo': { $regex: criteria.searchTerm, $options: 'i' } }
        ];
    }

    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'username email firstName lastName')
        .lean();
};

// ============================================
// Virtual Fields
// ============================================

AuditLogSchema.virtual('isSuccessful').get(function() {
    return this.status === 'SUCCESS';
});

AuditLogSchema.virtual('isFailed').get(function() {
    return this.status === 'FAILED';
});

AuditLogSchema.virtual('hasChanges').get(function() {
    return this.changes && (this.changes.before || this.changes.after);
});

// ============================================
// Pre/Post Middleware
// ============================================

// Ensure timestamp is set before saving
AuditLogSchema.pre('save', function(next) {
    if (!this.timestamp) {
        this.timestamp = new Date();
    }
    next();
});

// Post-save hook for any additional processing
AuditLogSchema.post('save', function(doc) {
    // Can be used for real-time notifications or additional logging
    // logger.debug(`Audit log created: ${doc.action} by admin ${doc.adminId}`);
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;
