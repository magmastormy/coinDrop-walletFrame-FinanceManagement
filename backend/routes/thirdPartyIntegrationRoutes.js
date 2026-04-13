const express = require('express');
const router = express.Router();
const thirdPartyIntegrationController = require('../controllers/thirdPartyIntegrationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminRoleMiddleware } = require('../middleware/securityMiddleware');
const { mfaVerificationMiddleware } = require('../middleware/mfaMiddleware');
const { ipGeoMiddleware, ipRateLimitMiddleware } = require('../middleware/ipGeoMiddleware');
const { responseFilterMiddleware, credentialViewMiddleware } = require('../middleware/responseFilterMiddleware');

/**
 * Third Party Integration Routes
 *
 * These routes handle third-party integration management
 * for both admin controls and user access.
 *
 * Security Layers Applied:
 * 1. Authentication (authMiddleware)
 * 2. Admin Role Verification (adminRoleMiddleware)
 * 3. MFA Verification (mfaVerificationMiddleware) - for sensitive operations
 * 4. IP Whitelisting & Geo-Restriction (ipGeoMiddleware)
 * 5. Rate Limiting (ipRateLimitMiddleware)
 * 6. Response Filtering (responseFilterMiddleware)
 */

// Apply response filtering to all routes
router.use(responseFilterMiddleware({
  sensitiveFields: [
    'credentials',
    'encryptedCredentials',
    'encryptionMetadata',
    'webhookConfig.secret',
    'apiKey',
    'apiSecret',
    'privateKey',
    'password',
    'token',
    'secret'
  ],
  includeMetadata: true
}));

// Admin routes (require admin privileges + MFA + IP/geo checks)
router.get('/',
  authMiddleware,
  adminRoleMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: false
  }),
  ipRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),
  thirdPartyIntegrationController.listIntegrations
);

router.get('/:id',
  authMiddleware,
  adminRoleMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: false
  }),
  ipRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    maxRequests: 200
  }),
  thirdPartyIntegrationController.getIntegrationDetails
);

// Create integration - requires MFA
router.post('/',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true // Block VPNs for creation
  }),
  ipRateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // Stricter limit for creation
  }),
  thirdPartyIntegrationController.createIntegration
);

// Update integration - requires MFA
router.put('/:id',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true
  }),
  ipRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    maxRequests: 20
  }),
  thirdPartyIntegrationController.updateIntegration
);

// Delete integration - requires MFA (strictest controls)
router.delete('/:id',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true
  }),
  ipRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5 // Very strict for deletion
  }),
  thirdPartyIntegrationController.deleteIntegration
);

// Test integration - requires MFA
router.post('/:id/test',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: false
  }),
  ipRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10
  }),
  thirdPartyIntegrationController.testIntegration
);

// Update integration status - requires MFA
router.patch('/:id/status',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true
  }),
  ipRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30
  }),
  thirdPartyIntegrationController.updateIntegrationStatus
);

// View credentials - requires MFA + explicit permission check
router.get('/:id/credentials',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  credentialViewMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true
  }),
  ipRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5 // Very strict for credential viewing
  }),
  thirdPartyIntegrationController.viewCredentials
);

// Rotate encryption keys - requires MFA
router.post('/:id/rotate-keys',
  authMiddleware,
  adminRoleMiddleware,
  mfaVerificationMiddleware,
  ipGeoMiddleware({
    allowPrivateIPs: true,
    blockVPNs: true
  }),
  ipRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3 // Very strict for key rotation
  }),
  thirdPartyIntegrationController.rotateKeys
);

// User routes (require authentication but not admin privileges)
router.get('/user/accessible',
  authMiddleware,
  ipRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    maxRequests: 50
  }),
  thirdPartyIntegrationController.getUserAccessibleIntegrations
);

module.exports = router;
