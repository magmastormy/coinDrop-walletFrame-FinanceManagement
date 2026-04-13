const mongoose = require('mongoose');
const credentialEncryptionService = require('../services/credentialEncryptionService');
const logger = require('../utils/logger');

/**
 * Third Party Integration Model (Security-Hardened)
 * 
 * Stores configuration and settings for third-party services
 * with enterprise-grade security controls including:
 * - Field-level encryption for credentials
 * - Audit logging and access tracking
 * - IP whitelisting and geo-restriction
 * - Compliance tagging and data classification
 */

const ThirdPartyIntegrationSchema = new mongoose.Schema({
  // Integration type (e.g., payment_gateway, financial_api, cloud_storage, etc.)
  type: {
    type: String,
    required: true,
    enum: [
      'payment_gateway',
      'financial_api',
      'cloud_storage',
      'analytics',
      'notifications',
      'crypto_exchange',
      'ai_advisor'
    ]
  },

  // Service provider name (e.g., Stripe, Plaid, AWS, etc.)
  provider: {
    type: String,
    required: true
  },

  // Integration name (e.g., 'Stripe Payment Processing')
  name: {
    type: String,
    required: true
  },

  // Description of the integration
  description: {
    type: String
  },

  // Whether the integration is enabled globally
  isEnabled: {
    type: Boolean,
    default: false
  },

  // Whether users can access this integration
  userAccessible: {
    type: Boolean,
    default: false
  },

  // Configuration settings for the integration (non-sensitive)
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ENCRYPTED: API keys and credentials
  encryptedCredentials: {
    type: String,
    default: null
  },

  // Encryption metadata for credential decryption
  encryptionMetadata: {
    dekId: { type: String },
    encryptedDEK: { type: String },
    algorithm: { type: String, default: 'aes-256-gcm' },
    keyVersion: { type: String, default: '1' },
    encryptedAt: { type: Date }
  },

  // DEPRECATED: Plaintext credentials (for migration only)
  // This field will be removed after migration
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    select: false // Never include in queries by default
  },

  // Rate limits and usage restrictions
  rateLimits: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    burstLimit: { type: Number, default: 10 },
    cooldownPeriod: { type: Number, default: 60 } // seconds
  },

  // Webhook URLs and callback settings
  webhookConfig: {
    url: { type: String },
    secret: { type: String, select: false }, // Encrypted webhook secret
    events: [{ type: String }],
    enabled: { type: Boolean, default: false },
    signatureHeader: { type: String, default: 'X-Webhook-Signature' }
  },

  // Status information
  status: {
    type: String,
    default: 'inactive',
    enum: ['active', 'inactive', 'error', 'maintenance']
  },

  // Error information if status is 'error'
  errorInfo: {
    message: { type: String },
    code: { type: String },
    timestamp: { type: Date },
    retryCount: { type: Number, default: 0 }
  },

  // Last time the integration was tested
  lastTested: {
    type: Date
  },

  // Usage statistics
  usageStats: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    lastRequest: { type: Date },
    averageResponseTime: { type: Number, default: 0 } // milliseconds
  },

  // SECURITY FIELDS

  // Audit fields for credential access tracking
  lastAccessed: {
    type: Date,
    default: null
  },

  accessCount: {
    type: Number,
    default: 0
  },

  lastAccessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // IP whitelisting for admin access
  allowedIPs: [{
    type: String,
    validate: {
      validator: function (v) {
        // Validate IP address or CIDR notation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        return ipRegex.test(v);
      },
      message: 'Invalid IP address or CIDR notation'
    }
  }],

  // Geo-restriction for admin access
  allowedRegions: [{
    type: String,
    uppercase: true,
    trim: true
    // ISO 3166-1 alpha-2 country codes (e.g., 'US', 'GB', 'DE')
  }],

  // MFA requirement for this integration
  mfaRequired: {
    type: Boolean,
    default: true
  },

  // Compliance and data classification
  complianceTags: [{
    type: String,
    enum: ['gdpr', 'hipaa', 'pci-dss', 'soc2', 'iso27001', 'ccpa', 'sox']
  }],

  dataClassification: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'confidential'
  },

  // Security settings
  securitySettings: {
    requireApproval: { type: Boolean, default: false },
    autoDisableOnErrors: { type: Boolean, default: true },
    errorThreshold: { type: Number, default: 10 },
    notificationEmails: [{ type: String }]
  },

  // Admin notes
  notes: {
    type: String
  },

  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Last updated by admin
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Indexes for performance
ThirdPartyIntegrationSchema.index({ type: 1, provider: 1 });
ThirdPartyIntegrationSchema.index({ isEnabled: 1 });
ThirdPartyIntegrationSchema.index({ userAccessible: 1 });
ThirdPartyIntegrationSchema.index({ status: 1 });
ThirdPartyIntegrationSchema.index({ isDeleted: 1 });
ThirdPartyIntegrationSchema.index({ 'encryptionMetadata.dekId': 1 });
ThirdPartyIntegrationSchema.index({ complianceTags: 1 });
ThirdPartyIntegrationSchema.index({ dataClassification: 1 });

/**
 * Pre-save hook: Encrypt credentials before saving
 */
ThirdPartyIntegrationSchema.pre('save', async function (next) {
  try {
    this.updatedAt = new Date();

    // Encrypt credentials if they exist and are not already encrypted
    if (this.credentials && typeof this.credentials === 'object' && !this.isModified('encryptedCredentials')) {
      logger.info('Encrypting credentials for integration', { integrationId: this._id });

      const encryptionResult = credentialEncryptionService.encrypt(this.credentials);

      this.encryptedCredentials = encryptionResult.encryptedCredentials;
      this.encryptionMetadata = encryptionResult.encryptionMetadata;

      // Clear plaintext credentials (they will be removed in future migration)
      this.credentials = null;
    }

    // Encrypt webhook secret if present
    if (this.webhookConfig && this.webhookConfig.secret && !this.webhookConfig.secret.startsWith('enc:')) {
      const webhookEncryption = credentialEncryptionService.encrypt({ secret: this.webhookConfig.secret });
      this.webhookConfig.secret = `enc:${webhookEncryption.encryptedCredentials}`;
    }

    next();
  } catch (error) {
    logger.error('Pre-save encryption failed', { error: error.message, integrationId: this._id });
    next(error);
  }
});

/**
 * Method: Decrypt and retrieve credentials
 * @param {Object} options - Options for credential retrieval
 * @returns {Object|null} Decrypted credentials or null
 */
ThirdPartyIntegrationSchema.methods.getCredentials = async function (options = {}) {
  try {
    const { userId, purpose, skipAudit } = options;

    // Check if credentials are encrypted
    if (!this.encryptedCredentials || !this.encryptionMetadata) {
      // Fallback to legacy credentials field
      if (this.credentials) {
        logger.warn('Using unencrypted credentials', { integrationId: this._id });
        return this.credentials;
      }
      return null;
    }

    // Decrypt credentials
    const decrypted = credentialEncryptionService.decrypt(
      this.encryptedCredentials,
      this.encryptionMetadata
    );

    // Update audit fields
    if (!skipAudit) {
      this.lastAccessed = new Date();
      this.accessCount += 1;
      if (userId) {
        this.lastAccessedBy = userId;
      }
      await this.save();
    }

    logger.info('Credentials accessed', {
      integrationId: this._id,
      userId,
      purpose,
      accessCount: this.accessCount
    });

    return decrypted;
  } catch (error) {
    logger.error('Failed to decrypt credentials', { error: error.message, integrationId: this._id });
    throw new Error('Credential decryption failed');
  }
};

/**
 * Method: Set credentials (will be encrypted on save)
 * @param {Object} credentials - Credentials to set
 */
ThirdPartyIntegrationSchema.methods.setCredentials = function (credentials) {
  this.credentials = credentials; // Will be encrypted by pre-save hook
  this.encryptedCredentials = null; // Force re-encryption
  this.encryptionMetadata = null;
};

/**
 * Method: Check if IP is allowed
 * @param {string} ip - IP address to check
 * @returns {boolean} Whether IP is allowed
 */
ThirdPartyIntegrationSchema.methods.isIPAllowed = function (ip) {
  if (!this.allowedIPs || this.allowedIPs.length === 0) {
    return true; // No restrictions
  }

  return this.allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation check
      return this._isIPInCIDR(ip, allowedIP);
    }
    return ip === allowedIP;
  });
};

/**
 * Helper: Check if IP is in CIDR range
 * @private
 */
ThirdPartyIntegrationSchema.methods._isIPInCIDR = function (ip, cidr) {
  const [range, bits = 32] = cidr.split('/');
  const mask = parseInt(bits);

  const ipParts = ip.split('.').map(Number);
  const rangeParts = range.split('.').map(Number);

  const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

  const maskInt = -1 << (32 - mask);

  return (ipInt & maskInt) === (rangeInt & maskInt);
};

/**
 * Method: Check if region is allowed
 * @param {string} region - Region code to check
 * @returns {boolean} Whether region is allowed
 */
ThirdPartyIntegrationSchema.methods.isRegionAllowed = function (region) {
  if (!this.allowedRegions || this.allowedRegions.length === 0) {
    return true; // No restrictions
  }

  return this.allowedRegions.includes(region.toUpperCase());
};

/**
 * Method: Soft delete integration
 * @param {string} userId - ID of user performing deletion
 */
ThirdPartyIntegrationSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isEnabled = false;
  this.status = 'inactive';

  await this.save();

  logger.info('Integration soft deleted', { integrationId: this._id, deletedBy: userId });
};

/**
 * Method: Restore soft-deleted integration
 */
ThirdPartyIntegrationSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;

  await this.save();

  logger.info('Integration restored', { integrationId: this._id });
};

/**
 * Method: Record usage statistics
 * @param {boolean} success - Whether the request was successful
 * @param {number} responseTime - Response time in milliseconds
 */
ThirdPartyIntegrationSchema.methods.recordUsage = async function (success, responseTime) {
  this.usageStats.totalRequests += 1;
  this.usageStats.lastRequest = new Date();

  if (success) {
    this.usageStats.successfulRequests += 1;
  } else {
    this.usageStats.failedRequests += 1;
  }

  // Update average response time
  const currentAvg = this.usageStats.averageResponseTime;
  const totalRequests = this.usageStats.totalRequests;
  this.usageStats.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

  await this.save();
};

/**
 * Method: Rotate encryption key
 */
ThirdPartyIntegrationSchema.methods.rotateEncryptionKey = async function () {
  try {
    if (!this.encryptedCredentials || !this.encryptionMetadata) {
      throw new Error('No encrypted credentials to rotate');
    }

    const newEncryption = credentialEncryptionService.rotateKey(
      this.encryptedCredentials,
      this.encryptionMetadata
    );

    this.encryptedCredentials = newEncryption.encryptedCredentials;
    this.encryptionMetadata = newEncryption.encryptionMetadata;

    await this.save();

    logger.info('Encryption key rotated', {
      integrationId: this._id,
      oldDekId: this.encryptionMetadata.dekId,
      newDekId: newEncryption.encryptionMetadata.dekId
    });

    return true;
  } catch (error) {
    logger.error('Key rotation failed', { error: error.message, integrationId: this._id });
    throw error;
  }
};

/**
 * Static method: Find active integrations
 */
ThirdPartyIntegrationSchema.statics.findActive = function () {
  return this.find({
    isEnabled: true,
    isDeleted: false,
    status: { $in: ['active', 'maintenance'] }
  });
};

/**
 * Static method: Find user-accessible integrations
 */
ThirdPartyIntegrationSchema.statics.findUserAccessible = function () {
  return this.find({
    isEnabled: true,
    userAccessible: true,
    isDeleted: false,
    status: 'active'
  }).select('-encryptedCredentials -encryptionMetadata -webhookConfig.secret -credentials');
};

const ThirdPartyIntegration = mongoose.model('ThirdPartyIntegration', ThirdPartyIntegrationSchema);

module.exports = ThirdPartyIntegration;
