const mongoose = require('mongoose');
const ThirdPartyIntegration = require('../models/ThirdPartyIntegration');
const auditLogService = require('../services/auditLogService');
const { performance } = require('perf_hooks');

// Error classes
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  InternalServerError,
  ForbiddenError
} = require('../utils/errorClasses');

// Logger
const logger = require('../utils/logger');

/**
 * Helper function to extract metadata from request
 * @param {Object} req - Express request object
 * @returns {Object} Metadata object
 */
const extractMetadata = (req) => ({
  ipAddress: req.clientIP || req.ip || req.connection?.remoteAddress || null,
  userAgent: req.headers['user-agent'] || null,
  sessionId: req.sessionID || null,
  requestId: req.requestId || null
});

/**
 * Helper function to build pagination response
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object
 */
const buildPagination = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit)
});

/**
 * Helper function to log audit entry
 * @param {Object} req - Express request
 * @param {string} action - Audit action
 * @param {Object} data - Additional data
 */
const logAudit = async (req, action, data = {}) => {
  try {
    await auditLogService.log({
      action,
      actor: {
        userId: req.user?.userId || req.authUserId,
        username: req.user?.username,
        role: req.user?.role,
        ...extractMetadata(req)
      },
      target: {
        integrationId: data.integrationId,
        integrationName: data.integrationName,
        integrationType: data.integrationType
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body
      },
      response: {
        statusCode: data.statusCode,
        success: data.success,
        errorMessage: data.errorMessage
      },
      security: {
        mfaVerified: req.mfaVerified || false,
        ipAllowed: true,
        geoAllowed: true,
        rateLimitAllowed: true
      },
      metadata: data.metadata || {}
    });
  } catch (error) {
    logger.error('Failed to log audit entry', { error: error.message, action });
  }
};

const thirdPartyIntegrationController = {
  /**
   * List all third-party integrations
   */
  listIntegrations: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;

    try {
      const {
        page = 1,
        limit = 10,
        type,
        provider,
        status,
        isEnabled,
        userAccessible,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      logger.info('Listing third-party integrations', { adminId, page, limit, type, provider, status });

      // Build filter object
      const filter = { isDeleted: false };

      if (type) {
        filter.type = type;
      }

      if (provider) {
        filter.provider = { $regex: provider, $options: 'i' };
      }

      if (status) {
        filter.status = status;
      }

      if (isEnabled !== undefined) {
        filter.isEnabled = isEnabled === 'true';
      }

      if (userAccessible !== undefined) {
        filter.userAccessible = userAccessible === 'true';
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute queries in parallel
      const [integrations, totalIntegrations] = await Promise.all([
        ThirdPartyIntegration.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        ThirdPartyIntegration.countDocuments(filter)
      ]);

      const duration = performance.now() - startTime;
      logger.info('Third-party integrations listed successfully', { adminId, count: integrations.length, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'VIEW_INTEGRATION', {
        statusCode: 200,
        success: true,
        metadata: { count: integrations.length }
      });

      res.status(200).json({
        success: true,
        data: {
          integrations,
          pagination: buildPagination(totalIntegrations, page, limit)
        },
        message: 'Third-party integrations retrieved successfully'
      });
    } catch (error) {
      logger.error('Error listing third-party integrations', { adminId, error: error.message });
      await logAudit(req, 'VIEW_INTEGRATION', {
        statusCode: 500,
        success: false,
        errorMessage: error.message
      });
      next(new DatabaseError('Failed to list third-party integrations', 'query'));
    }
  },

  /**
   * Get integration details by ID
   */
  getIntegrationDetails: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Fetching third-party integration details', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      }).lean();

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      const duration = performance.now() - startTime;
      logger.info('Third-party integration details fetched successfully', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'VIEW_INTEGRATION', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true
      });

      res.status(200).json({
        success: true,
        data: integration,
        message: 'Third-party integration details retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching third-party integration details', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'VIEW_INTEGRATION', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Create a new third-party integration
   */
  createIntegration: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;

    try {
      const {
        type,
        provider,
        name,
        description,
        isEnabled,
        userAccessible,
        config,
        credentials,
        rateLimits,
        webhookConfig,
        notes,
        allowedIPs,
        allowedRegions,
        mfaRequired,
        complianceTags,
        dataClassification
      } = req.body;

      logger.info('Creating new third-party integration', { adminId, type, provider, name });

      // Validate required fields
      if (!type || !provider || !name) {
        throw new ValidationError('Missing required fields', [
          { field: 'type', message: 'Integration type is required' },
          { field: 'provider', message: 'Provider name is required' },
          { field: 'name', message: 'Integration name is required' }
        ]);
      }

      // Check for existing integration with same type and provider
      const existingIntegration = await ThirdPartyIntegration.findOne({
        type,
        provider,
        isDeleted: false
      });

      if (existingIntegration) {
        throw new ConflictError(`Integration with type '${type}' and provider '${provider}' already exists`);
      }

      // Create new integration
      const newIntegration = new ThirdPartyIntegration({
        type,
        provider,
        name,
        description,
        isEnabled: isEnabled || false,
        userAccessible: userAccessible || false,
        config: config || {},
        credentials: credentials || {}, // Will be encrypted by pre-save hook
        rateLimits: rateLimits || {},
        webhookConfig: webhookConfig || {},
        notes,
        allowedIPs: allowedIPs || [],
        allowedRegions: allowedRegions || [],
        mfaRequired: mfaRequired !== undefined ? mfaRequired : true,
        complianceTags: complianceTags || [],
        dataClassification: dataClassification || 'confidential',
        updatedBy: adminId
      });

      await newIntegration.save();

      const duration = performance.now() - startTime;
      logger.info('Third-party integration created successfully', { adminId, integrationId: newIntegration._id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'CREATE_INTEGRATION', {
        integrationId: newIntegration._id,
        integrationName: newIntegration.name,
        integrationType: newIntegration.type,
        statusCode: 201,
        success: true
      });

      res.status(201).json({
        success: true,
        data: newIntegration.toObject(),
        message: 'Third-party integration created successfully'
      });
    } catch (error) {
      logger.error('Error creating third-party integration', { adminId, error: error.message });
      await logAudit(req, 'CREATE_INTEGRATION', {
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Update third-party integration by ID
   */
  updateIntegration: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Updating third-party integration', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Check IP whitelist if configured
      if (integration.allowedIPs && integration.allowedIPs.length > 0) {
        const clientIP = req.clientIP || req.ip;
        if (!integration.isIPAllowed(clientIP)) {
          await logAudit(req, 'ACCESS_DENIED', {
            integrationId: id,
            statusCode: 403,
            success: false,
            errorMessage: 'IP not in whitelist',
            metadata: { reason: 'IP_BLOCKED', clientIP }
          });
          throw new ForbiddenError('Access denied: IP not in whitelist');
        }
      }

      // Update fields
      const updates = req.body;
      Object.keys(updates).forEach(key => {
        if (key !== '_id' && key !== 'createdAt' && key !== 'encryptedCredentials' && key !== 'encryptionMetadata') {
          integration[key] = updates[key];
        }
      });

      // Handle credentials update separately
      if (updates.credentials) {
        integration.setCredentials(updates.credentials);
      }

      integration.updatedBy = adminId;
      await integration.save();

      const duration = performance.now() - startTime;
      logger.info('Third-party integration updated successfully', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'UPDATE_INTEGRATION', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true
      });

      res.status(200).json({
        success: true,
        data: integration.toObject(),
        message: 'Third-party integration updated successfully'
      });
    } catch (error) {
      logger.error('Error updating third-party integration', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'UPDATE_INTEGRATION', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Delete third-party integration by ID (soft delete)
   */
  deleteIntegration: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Deleting third-party integration', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Soft delete
      await integration.softDelete(adminId);

      const duration = performance.now() - startTime;
      logger.info('Third-party integration deleted successfully', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'DELETE_INTEGRATION', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true
      });

      res.status(200).json({
        success: true,
        data: { integrationId: id, deletedAt: new Date(), deletedBy: adminId },
        message: 'Third-party integration deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting third-party integration', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'DELETE_INTEGRATION', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Test third-party integration connection
   */
  testIntegration: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Testing third-party integration', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Simulate integration test (replace with actual test logic)
      let testResult;
      let testError;

      try {
        // Here you would implement actual test logic for the specific integration
        // This is a placeholder for demonstration purposes
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        testResult = {
          status: 'success',
          message: 'Integration test passed',
          responseTime: '1.0s',
          details: 'Connection established successfully'
        };

        // Update integration status and last tested time
        integration.status = 'active';
        integration.lastTested = new Date();
        integration.errorInfo = {};
      } catch (error) {
        testError = error;
        testResult = {
          status: 'error',
          message: 'Integration test failed',
          error: error.message || 'Unknown error'
        };

        // Update integration status and error info
        integration.status = 'error';
        integration.errorInfo = {
          message: error.message || 'Unknown error',
          timestamp: new Date()
        };
      }

      await integration.save();

      const duration = performance.now() - startTime;
      logger.info('Third-party integration test completed', { adminId, integrationId: id, status: testResult.status, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'TEST_INTEGRATION', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: testError ? 500 : 200,
        success: !testError,
        errorMessage: testError?.message,
        metadata: { testStatus: testResult.status }
      });

      res.status(200).json({
        success: true,
        data: {
          integration: integration.toObject(),
          testResult
        },
        message: `Third-party integration test ${testResult.status === 'success' ? 'passed' : 'failed'}`
      });
    } catch (error) {
      logger.error('Error testing third-party integration', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'TEST_INTEGRATION', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Get user-accessible integrations
   * This endpoint is for user-facing applications to get available integrations
   */
  getUserAccessibleIntegrations: async (req, res, next) => {
    const startTime = performance.now();
    const userId = req.user?.userId || req.authUserId;

    try {
      logger.info('Fetching user-accessible integrations', { userId });

      // Get integrations that are enabled and user-accessible
      const integrations = await ThirdPartyIntegration.findUserAccessible();

      const duration = performance.now() - startTime;
      logger.info('User-accessible integrations fetched successfully', { userId, count: integrations.length, duration: `${duration.toFixed(2)}ms` });

      res.status(200).json({
        success: true,
        data: integrations,
        message: 'User-accessible integrations retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching user-accessible integrations', { userId, error: error.message });
      next(new DatabaseError('Failed to fetch user-accessible integrations', 'query'));
    }
  },

  /**
   * Update integration status (enable/disable)
   */
  updateIntegrationStatus: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;
    const { isEnabled, status } = req.body;

    try {
      logger.info('Updating third-party integration status', { adminId, integrationId: id, isEnabled, status });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Update status fields
      if (isEnabled !== undefined) {
        integration.isEnabled = isEnabled;
      }

      if (status) {
        integration.status = status;
      }

      integration.updatedBy = adminId;
      await integration.save();

      const duration = performance.now() - startTime;
      logger.info('Third-party integration status updated successfully', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      const action = isEnabled ? 'ENABLE_INTEGRATION' : 'DISABLE_INTEGRATION';
      await logAudit(req, action, {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true,
        metadata: { isEnabled, status }
      });

      res.status(200).json({
        success: true,
        data: integration.toObject(),
        message: 'Third-party integration status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating third-party integration status', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'UPDATE_INTEGRATION', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * View integration credentials (requires MFA and explicit permission)
   */
  viewCredentials: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Viewing integration credentials', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Get decrypted credentials
      const credentials = await integration.getCredentials({
        userId: adminId,
        purpose: 'view_credentials'
      });

      const duration = performance.now() - startTime;
      logger.info('Integration credentials viewed', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'VIEW_CREDENTIALS', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true
      });

      res.status(200).json({
        success: true,
        data: {
          integrationId: id,
          credentials
        },
        message: 'Credentials retrieved successfully'
      });
    } catch (error) {
      logger.error('Error viewing credentials', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'VIEW_CREDENTIALS', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  },

  /**
   * Rotate encryption keys for integration
   */
  rotateKeys: async (req, res, next) => {
    const startTime = performance.now();
    const adminId = req.user?.userId || req.authUserId;
    const { id } = req.params;

    try {
      logger.info('Rotating integration encryption keys', { adminId, integrationId: id });

      // Validate integration ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid integration ID format');
      }

      // Get integration
      const integration = await ThirdPartyIntegration.findOne({
        _id: id,
        isDeleted: false
      });

      if (!integration) {
        throw new NotFoundError('Third-party integration not found', 'THIRD_PARTY_INTEGRATION');
      }

      // Rotate encryption keys
      await integration.rotateEncryptionKey();

      const duration = performance.now() - startTime;
      logger.info('Integration encryption keys rotated successfully', { adminId, integrationId: id, duration: `${duration.toFixed(2)}ms` });

      // Log audit
      await logAudit(req, 'ROTATE_KEYS', {
        integrationId: id,
        integrationName: integration.name,
        integrationType: integration.type,
        statusCode: 200,
        success: true
      });

      res.status(200).json({
        success: true,
        data: {
          integrationId: id,
          rotatedAt: new Date()
        },
        message: 'Encryption keys rotated successfully'
      });
    } catch (error) {
      logger.error('Error rotating encryption keys', { adminId, integrationId: id, error: error.message });
      await logAudit(req, 'ROTATE_KEYS', {
        integrationId: id,
        statusCode: error.statusCode || 500,
        success: false,
        errorMessage: error.message
      });
      next(error);
    }
  }
};

module.exports = thirdPartyIntegrationController;
