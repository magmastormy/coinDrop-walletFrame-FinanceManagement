const logger = require('../utils/logger');

/**
 * Response Filter Middleware
 *
 * Prevents credential leakage in API responses by filtering sensitive fields.
 * Implements field-level access control with explicit whitelisting.
 */

// Default sensitive fields to exclude
const DEFAULT_SENSITIVE_FIELDS = [
  'credentials',
  'encryptedCredentials',
  'encryptionMetadata',
  'webhookConfig.secret',
  'apiKey',
  'apiSecret',
  'privateKey',
  'password',
  'token',
  'secret',
  'dek',
  'kek'
];

// Fields that require explicit permission to view
const PERMISSION_REQUIRED_FIELDS = [
  'credentials',
  'encryptedCredentials',
  'encryptionMetadata.encryptedDEK'
];

/**
 * Check if user has permission to view sensitive field
 * @param {Object} req - Express request
 * @param {string} field - Field name
 * @returns {boolean} Whether user has permission
 */
const hasFieldPermission = (req, field) => {
  // Check if MFA was verified for this request
  if (!req.mfaVerified) {
    return false;
  }

  // Check user role/permissions
  const userRole = req.user?.role;
  if (userRole === 'superadmin' || userRole === 'security_admin') {
    return true;
  }

  // Check for explicit permission
  const permissions = req.user?.permissions || [];
  return permissions.includes('view_credentials') ||
    permissions.includes('view_integration_secrets');
};

/**
 * Filter sensitive fields from object
 * @param {Object} obj - Object to filter
 * @param {Array} sensitiveFields - Fields to remove
 * @param {Object} options - Filter options
 * @returns {Object} Filtered object
 */
const filterSensitiveFields = (obj, sensitiveFields = DEFAULT_SENSITIVE_FIELDS, options = {}) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const { keepMetadata = true, userPermissions = [] } = options;

  // Create shallow copy
  const filtered = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const field of sensitiveFields) {
    // Handle nested fields (e.g., 'webhookConfig.secret')
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = filtered;

      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] && typeof current[parts[i]] === 'object') {
          current = current[parts[i]];
        } else {
          break;
        }
      }

      const lastPart = parts[parts.length - 1];
      if (current && current.hasOwnProperty(lastPart)) {
        // Check if field requires explicit permission
        if (PERMISSION_REQUIRED_FIELDS.includes(field)) {
          // Only remove if user doesn't have permission
          if (!userPermissions.includes('view_credentials')) {
            delete current[lastPart];
          }
        } else {
          delete current[lastPart];
        }
      }
    } else {
      // Handle top-level fields
      if (filtered.hasOwnProperty(field)) {
        // Check if field requires explicit permission
        if (PERMISSION_REQUIRED_FIELDS.includes(field)) {
          // Only remove if user doesn't have permission
          if (!userPermissions.includes('view_credentials')) {
            delete filtered[field];
          }
        } else {
          delete filtered[field];
        }
      }
    }
  }

  // Add metadata about filtered fields if requested
  if (keepMetadata && !Array.isArray(filtered)) {
    filtered._metadata = {
      filtered: true,
      filteredFields: sensitiveFields,
      timestamp: new Date().toISOString()
    };
  }

  return filtered;
};

/**
 * Response Filter Middleware
 * Filters sensitive data from JSON responses
 */
const responseFilterMiddleware = (options = {}) => {
  const {
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    excludePaths = [], // Paths to skip filtering
    includeMetadata = true
  } = options;

  return (req, res, next) => {
    // Skip filtering for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data) {
      try {
        // Check if response should be filtered
        if (data && (data.data || Array.isArray(data))) {
          const userPermissions = req.user?.permissions || [];

          // Filter single object
          if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            data.data = filterSensitiveFields(data.data, sensitiveFields, {
              keepMetadata: includeMetadata,
              userPermissions
            });
          }

          // Filter array of objects
          if (Array.isArray(data)) {
            data = data.map(item => filterSensitiveFields(item, sensitiveFields, {
              keepMetadata: includeMetadata,
              userPermissions
            }));
          }

          // Filter data array in paginated response
          if (data.data && data.data.integrations && Array.isArray(data.data.integrations)) {
            data.data.integrations = data.data.integrations.map(item =>
              filterSensitiveFields(item, sensitiveFields, {
                keepMetadata: includeMetadata,
                userPermissions
              })
            );
          }
        }

        return originalJson(data);
      } catch (error) {
        logger.error('Response filtering failed', { error: error.message });
        return originalJson(data);
      }
    };

    next();
  };
};

/**
 * Field-Level Permission Middleware
 * Checks if user has permission to access specific fields
 */
const fieldPermissionMiddleware = (requiredFields = []) => {
  return (req, res, next) => {
    try {
      // Check if any sensitive fields are being requested
      const requestedFields = req.query.fields || req.body.fields || [];

      if (!Array.isArray(requestedFields)) {
        return next();
      }

      // Find intersection of requested fields and permission-required fields
      const sensitiveRequested = requestedFields.filter(field =>
        PERMISSION_REQUIRED_FIELDS.includes(field)
      );

      if (sensitiveRequested.length === 0) {
        return next();
      }

      // Check if user has permission for sensitive fields
      if (!hasFieldPermission(req, sensitiveRequested[0])) {
        logger.warn('Unauthorized field access attempt', {
          userId: req.user?.userId,
          fields: sensitiveRequested,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access requested fields',
          code: 'FIELD_PERMISSION_DENIED'
        });
      }

      next();
    } catch (error) {
      logger.error('Field permission check failed', { error: error.message });
      next(error);
    }
  };
};

/**
 * Selective Field Middleware
 * Allows explicit inclusion of fields with permission checks
 */
const selectiveFieldMiddleware = (options = {}) => {
  const {
    defaultFields = [], // Fields to include by default
    sensitiveFields = PERMISSION_REQUIRED_FIELDS // Fields requiring permission
  } = options;

  return (req, res, next) => {
    // Parse fields query parameter
    let requestedFields = req.query.fields;

    if (requestedFields) {
      // Convert comma-separated string to array
      if (typeof requestedFields === 'string') {
        requestedFields = requestedFields.split(',').map(f => f.trim());
      }

      // Check for sensitive fields
      const sensitiveRequested = requestedFields.filter(field =>
        sensitiveFields.some(sf => field === sf || field.startsWith(`${sf}.`))
      );

      if (sensitiveRequested.length > 0 && !hasFieldPermission(req, sensitiveRequested[0])) {
        logger.warn('Unauthorized sensitive field access', {
          userId: req.user?.userId,
          fields: sensitiveRequested
        });

        // Remove sensitive fields from request
        requestedFields = requestedFields.filter(field =>
          !sensitiveFields.some(sf => field === sf || field.startsWith(`${sf}.`))
        );
      }

      // Store filtered fields for use in controller
      req.allowedFields = requestedFields;
    } else {
      // Use default fields
      req.allowedFields = defaultFields;
    }

    next();
  };
};

/**
 * Sanitize Response Data
 * Utility function to manually sanitize data
 * @param {Object} data - Data to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized data
 */
const sanitizeResponseData = (data, options = {}) => {
  const {
    removeFields = DEFAULT_SENSITIVE_FIELDS,
    redactInsteadOfRemove = false
  } = options;

  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const field of removeFields) {
    if (field.includes('.')) {
      // Handle nested fields
      const parts = field.split('.');
      let current = sanitized;

      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] && typeof current[parts[i]] === 'object') {
          current = current[parts[i]];
        } else {
          break;
        }
      }

      const lastPart = parts[parts.length - 1];
      if (current && current.hasOwnProperty(lastPart)) {
        if (redactInsteadOfRemove) {
          current[lastPart] = '[REDACTED]';
        } else {
          delete current[lastPart];
        }
      }
    } else {
      if (sanitized.hasOwnProperty(field)) {
        if (redactInsteadOfRemove) {
          sanitized[field] = '[REDACTED]';
        } else {
          delete sanitized[field];
        }
      }
    }
  }

  return sanitized;
};

/**
 * Credential View Middleware
 * Special middleware for credential viewing endpoint
 */
const credentialViewMiddleware = async (req, res, next) => {
  try {
    // Require MFA
    if (!req.mfaVerified) {
      return res.status(403).json({
        success: false,
        message: 'MFA verification required to view credentials',
        code: 'MFA_REQUIRED'
      });
    }

    // Require explicit permission
    const permissions = req.user?.permissions || [];
    if (!permissions.includes('view_credentials')) {
      logger.warn('Unauthorized credential view attempt', {
        userId: req.user?.userId,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view credentials',
        code: 'CREDENTIAL_VIEW_DENIED'
      });
    }

    // Log credential access
    logger.info('Credential view authorized', {
      userId: req.user?.userId,
      integrationId: req.params.id,
      ip: req.clientIP || req.ip
    });

    // Mark request as authorized for credential view
    req.credentialViewAuthorized = true;

    next();
  } catch (error) {
    logger.error('Credential view middleware error', { error: error.message });
    next(error);
  }
};

module.exports = {
  responseFilterMiddleware,
  fieldPermissionMiddleware,
  selectiveFieldMiddleware,
  credentialViewMiddleware,
  filterSensitiveFields,
  sanitizeResponseData,
  hasFieldPermission,
  DEFAULT_SENSITIVE_FIELDS,
  PERMISSION_REQUIRED_FIELDS
};
