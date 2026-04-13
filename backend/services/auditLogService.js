const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Audit Log Service
 *
 * Provides tamper-evident audit logging with blockchain-style chaining.
 * All integration-related activities are logged with cryptographic signatures.
 */

// Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  // Entry identification
  entryId: {
    type: String,
    required: true,
    unique: true
  },

  // Previous entry hash for chain integrity
  previousHash: {
    type: String,
    default: '0'
  },

  // Entry data
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },

  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_INTEGRATION',
      'UPDATE_INTEGRATION',
      'DELETE_INTEGRATION',
      'VIEW_INTEGRATION',
      'VIEW_CREDENTIALS',
      'TEST_INTEGRATION',
      'ENABLE_INTEGRATION',
      'DISABLE_INTEGRATION',
      'ROTATE_KEYS',
      'ACCESS_DENIED',
      'MFA_FAILURE',
      'RATE_LIMIT_EXCEEDED',
      'IP_BLOCKED',
      'GEO_BLOCKED'
    ]
  },

  // Actor information
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    role: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    sessionId: { type: String }
  },

  // Target information
  target: {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ThirdPartyIntegration' },
    integrationName: { type: String },
    integrationType: { type: String }
  },

  // Request details
  request: {
    method: { type: String },
    path: { type: String },
    query: { type: mongoose.Schema.Types.Mixed },
    body: { type: mongoose.Schema.Types.Mixed } // Sanitized
  },

  // Response details
  response: {
    statusCode: { type: Number },
    success: { type: Boolean },
    errorMessage: { type: String }
  },

  // Security context
  security: {
    mfaVerified: { type: Boolean, default: false },
    ipAllowed: { type: Boolean, default: true },
    geoAllowed: { type: Boolean, default: true },
    rateLimitAllowed: { type: Boolean, default: true }
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Cryptographic signature
  hash: {
    type: String,
    required: true
  },

  signature: {
    type: String,
    required: true
  }
});

// Indexes for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
AuditLogSchema.index({ 'target.integrationId': 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entryId: 1 });
AuditLogSchema.index({ previousHash: 1 });

const IntegrationAuditLog = mongoose.model('IntegrationAuditLog', AuditLogSchema);

class AuditLogService {
  constructor() {
    // Signing key (in production, use HSM or KMS)
    this.signingKey = process.env.AUDIT_LOG_SIGNING_KEY ||
      crypto.scryptSync('audit-log-signing-key-dev-only', 'salt', 32);

    // Cache for last entry hash
    this.lastHash = '0';
    this.lastEntryId = null;

    // Initialize last hash from database
    this._initializeLastHash();
  }

  /**
   * Initialize last hash from database
   * @private
   */
  async _initializeLastHash() {
    try {
      const lastEntry = await IntegrationAuditLog.findOne()
        .sort({ timestamp: -1 })
        .select('hash entryId');

      if (lastEntry) {
        this.lastHash = lastEntry.hash;
        this.lastEntryId = lastEntry.entryId;
      }
    } catch (error) {
      logger.error('Failed to initialize audit log last hash', { error: error.message });
    }
  }

  /**
   * Generate unique entry ID
   * @returns {string} UUID
   */
  generateEntryId() {
    return crypto.randomUUID();
  }

  /**
   * Calculate hash for audit entry
   * @param {Object} entry - Audit entry data
   * @returns {string} SHA-256 hash
   */
  calculateHash(entry) {
    const data = JSON.stringify({
      entryId: entry.entryId,
      previousHash: entry.previousHash,
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      target: entry.target,
      request: entry.request,
      response: entry.response,
      security: entry.security,
      metadata: entry.metadata
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sign audit entry
   * @param {string} hash - Entry hash
   * @returns {string} HMAC signature
   */
  signEntry(hash) {
    return crypto.createHmac('sha256', this.signingKey).update(hash).digest('hex');
  }

  /**
   * Verify entry signature
   * @param {string} hash - Entry hash
   * @param {string} signature - Entry signature
   * @returns {boolean} Whether signature is valid
   */
  verifySignature(hash, signature) {
    const expectedSignature = this.signEntry(hash);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Log an audit entry
   * @param {Object} data - Audit data
   * @returns {Promise<Object>} Created audit log entry
   */
  async log(data) {
    try {
      const entryId = this.generateEntryId();
      const timestamp = new Date();

      // Build entry
      const entry = {
        entryId,
        previousHash: this.lastHash,
        timestamp,
        action: data.action,
        actor: {
          userId: data.actor?.userId,
          username: data.actor?.username,
          role: data.actor?.role,
          ipAddress: data.actor?.ipAddress,
          userAgent: data.actor?.userAgent,
          sessionId: data.actor?.sessionId
        },
        target: {
          integrationId: data.target?.integrationId,
          integrationName: data.target?.integrationName,
          integrationType: data.target?.integrationType
        },
        request: {
          method: data.request?.method,
          path: data.request?.path,
          query: data.request?.query,
          body: this._sanitizeBody(data.request?.body)
        },
        response: {
          statusCode: data.response?.statusCode,
          success: data.response?.success,
          errorMessage: data.response?.errorMessage
        },
        security: {
          mfaVerified: data.security?.mfaVerified || false,
          ipAllowed: data.security?.ipAllowed !== false,
          geoAllowed: data.security?.geoAllowed !== false,
          rateLimitAllowed: data.security?.rateLimitAllowed !== false
        },
        metadata: data.metadata || {}
      };

      // Calculate hash and signature
      const hash = this.calculateHash(entry);
      const signature = this.signEntry(hash);

      // Add hash and signature to entry
      entry.hash = hash;
      entry.signature = signature;

      // Save to database
      const auditLog = new IntegrationAuditLog(entry);
      await auditLog.save();

      // Update last hash cache
      this.lastHash = hash;
      this.lastEntryId = entryId;

      logger.debug('Audit log entry created', {
        entryId,
        action: entry.action,
        userId: entry.actor.userId
      });

      return auditLog.toObject();
    } catch (error) {
      logger.error('Failed to create audit log entry', {
        error: error.message,
        action: data.action
      });
      throw error;
    }
  }

  /**
   * Sanitize request body to remove sensitive data
   * @param {Object} body - Request body
   * @returns {Object} Sanitized body
   * @private
   */
  _sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password', 'secret', 'token', 'key', 'credential',
      'apiKey', 'apiSecret', 'webhookSecret', 'privateKey'
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this._sanitizeBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Query audit logs with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit log entries
   */
  async query(filters = {}, options = {}) {
    try {
      const {
        userId,
        integrationId,
        action,
        startDate,
        endDate,
        success
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = {};

      if (userId) {
        query['actor.userId'] = userId;
      }

      if (integrationId) {
        query['target.integrationId'] = integrationId;
      }

      if (action) {
        query.action = action;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      if (success !== undefined) {
        query['response.success'] = success;
      }

      // Execute query
      const entries = await IntegrationAuditLog.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await IntegrationAuditLog.countDocuments(query);

      return {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to query audit logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify integrity of audit log chain
   * @param {Date} startDate - Start date for verification
   * @param {Date} endDate - End date for verification
   * @returns {Promise<Object>} Verification result
   */
  async verifyChain(startDate, endDate) {
    try {
      const query = {};
      if (startDate) query.timestamp = { $gte: new Date(startDate) };
      if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };

      const entries = await IntegrationAuditLog.find(query)
        .sort({ timestamp: 1 })
        .lean();

      const results = {
        total: entries.length,
        valid: 0,
        invalid: 0,
        errors: []
      };

      let previousHash = '0';

      for (const entry of entries) {
        // Verify previous hash chain
        if (entry.previousHash !== previousHash) {
          results.invalid++;
          results.errors.push({
            entryId: entry.entryId,
            error: 'Previous hash mismatch',
            expected: previousHash,
            actual: entry.previousHash
          });
          continue;
        }

        // Verify entry hash
        const calculatedHash = this.calculateHash(entry);
        if (calculatedHash !== entry.hash) {
          results.invalid++;
          results.errors.push({
            entryId: entry.entryId,
            error: 'Hash mismatch',
            expected: calculatedHash,
            actual: entry.hash
          });
          continue;
        }

        // Verify signature
        if (!this.verifySignature(entry.hash, entry.signature)) {
          results.invalid++;
          results.errors.push({
            entryId: entry.entryId,
            error: 'Invalid signature'
          });
          continue;
        }

        results.valid++;
        previousHash = entry.hash;
      }

      logger.info('Audit log chain verification completed', {
        total: results.total,
        valid: results.valid,
        invalid: results.invalid
      });

      return results;
    } catch (error) {
      logger.error('Failed to verify audit log chain', { error: error.message });
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} filters - Export filters
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<string>} Exported data
   */
  async export(filters = {}, format = 'json') {
    try {
      const { entries } = await this.query(filters, { limit: 10000 });

      if (format === 'csv') {
        return this._exportToCSV(entries);
      }

      return JSON.stringify(entries, null, 2);
    } catch (error) {
      logger.error('Failed to export audit logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Export entries to CSV format
   * @param {Array} entries - Audit log entries
   * @returns {string} CSV data
   * @private
   */
  _exportToCSV(entries) {
    const headers = [
      'entryId',
      'timestamp',
      'action',
      'actor.userId',
      'actor.username',
      'actor.ipAddress',
      'target.integrationId',
      'target.integrationName',
      'request.method',
      'request.path',
      'response.statusCode',
      'response.success',
      'hash'
    ];

    const rows = entries.map(entry => [
      entry.entryId,
      entry.timestamp,
      entry.action,
      entry.actor?.userId,
      entry.actor?.username,
      entry.actor?.ipAddress,
      entry.target?.integrationId,
      entry.target?.integrationName,
      entry.request?.method,
      entry.request?.path,
      entry.response?.statusCode,
      entry.response?.success,
      entry.hash
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get audit statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(startDate, endDate) {
    try {
      const query = {};
      if (startDate) query.timestamp = { $gte: new Date(startDate) };
      if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };

      const stats = await IntegrationAuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: ['$response.success', 1, 0] }
            },
            failedActions: {
              $sum: { $cond: ['$response.success', 0, 1] }
            },
            uniqueUsers: { $addToSet: '$actor.userId' },
            uniqueIntegrations: { $addToSet: '$target.integrationId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalEntries: 1,
            successfulActions: 1,
            failedActions: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            uniqueIntegrations: { $size: '$uniqueIntegrations' }
          }
        }
      ]);

      const actionStats = await IntegrationAuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        summary: stats[0] || {
          totalEntries: 0,
          successfulActions: 0,
          failedActions: 0,
          uniqueUsers: 0,
          uniqueIntegrations: 0
        },
        actionBreakdown: actionStats
      };
    } catch (error) {
      logger.error('Failed to get audit statistics', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AuditLogService();
