#!/usr/bin/env node

/**
 * Migration Script: Third-Party Integration Security Hardening
 *
 * This script migrates existing third-party integrations to the new security model:
 * 1. Encrypts plaintext credentials using AES-256-GCM
 * 2. Adds new security fields with default values
 * 3. Validates migration integrity
 * 4. Provides rollback capability
 */

const mongoose = require('mongoose');
const ThirdPartyIntegration = require('../models/ThirdPartyIntegration');
const credentialEncryptionService = require('../services/credentialEncryptionService');
const logger = require('../utils/logger');

// Migration configuration
const CONFIG = {
  BATCH_SIZE: 100,
  DRY_RUN: process.env.DRY_RUN === 'true',
  ROLLBACK: process.env.ROLLBACK === 'true',
  BACKUP_COLLECTION: 'thirdpartyintegration_backup_pre_security_migration'
};

/**
 * Connect to database
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coindrop';
    await mongoose.connect(mongoURI);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};

/**
 * Create backup of existing data
 */
const createBackup = async () => {
  try {
    logger.info('Creating backup of existing integrations...');

    const integrations = await ThirdPartyIntegration.find({}).lean();

    if (integrations.length === 0) {
      logger.info('No integrations to backup');
      return;
    }

    // Create backup collection
    const backupCollection = mongoose.connection.collection(CONFIG.BACKUP_COLLECTION);
    await backupCollection.deleteMany({}); // Clear any existing backup
    await backupCollection.insertMany(integrations);

    logger.info(`Backup created successfully: ${integrations.length} integrations`);
  } catch (error) {
    logger.error('Backup creation failed', { error: error.message });
    throw error;
  }
};

/**
 * Restore from backup (rollback)
 */
const restoreFromBackup = async () => {
  try {
    logger.info('Restoring from backup...');

    const backupCollection = mongoose.connection.collection(CONFIG.BACKUP_COLLECTION);
    const backup = await backupCollection.find({}).toArray();

    if (backup.length === 0) {
      logger.warn('No backup found to restore');
      return;
    }

    // Clear current data and restore from backup
    await ThirdPartyIntegration.deleteMany({});

    // Remove MongoDB-specific fields before re-inserting
    const cleanedBackup = backup.map(item => {
      delete item._id;
      delete item.__v;
      return item;
    });

    await ThirdPartyIntegration.insertMany(cleanedBackup);

    logger.info(`Rollback completed: ${backup.length} integrations restored`);
  } catch (error) {
    logger.error('Rollback failed', { error: error.message });
    throw error;
  }
};

/**
 * Migrate single integration
 */
const migrateIntegration = async (integration) => {
  const updates = {};

  // 1. Encrypt credentials if they exist in plaintext
  if (integration.credentials && typeof integration.credentials === 'object') {
    if (!integration.encryptedCredentials) {
      try {
        const encryptionResult = credentialEncryptionService.encrypt(integration.credentials);
        updates.encryptedCredentials = encryptionResult.encryptedCredentials;
        updates.encryptionMetadata = encryptionResult.encryptionMetadata;
        updates.credentials = null; // Clear plaintext
        logger.info(`Encrypted credentials for integration: ${integration.name}`);
      } catch (error) {
        logger.error(`Failed to encrypt credentials for ${integration.name}`, { error: error.message });
        throw error;
      }
    }
  }

  // 2. Add new security fields with defaults
  if (!integration.allowedIPs) {
    updates.allowedIPs = [];
  }

  if (!integration.allowedRegions) {
    updates.allowedRegions = [];
  }

  if (integration.mfaRequired === undefined) {
    updates.mfaRequired = true;
  }

  if (!integration.complianceTags) {
    updates.complianceTags = [];
  }

  if (!integration.dataClassification) {
    updates.dataClassification = 'confidential';
  }

  // 3. Add audit fields
  if (!integration.lastAccessed) {
    updates.lastAccessed = null;
  }

  if (!integration.accessCount) {
    updates.accessCount = 0;
  }

  // 4. Add soft delete fields
  if (integration.isDeleted === undefined) {
    updates.isDeleted = false;
  }

  if (!integration.deletedAt) {
    updates.deletedAt = null;
  }

  // 5. Initialize usage stats if not present
  if (!integration.usageStats) {
    updates.usageStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastRequest: null,
      averageResponseTime: 0
    };
  }

  // 6. Add security settings
  if (!integration.securitySettings) {
    updates.securitySettings = {
      requireApproval: false,
      autoDisableOnErrors: true,
      errorThreshold: 10,
      notificationEmails: []
    };
  }

  return updates;
};

/**
 * Run migration
 */
const runMigration = async () => {
  try {
    logger.info('Starting security migration...');
    logger.info(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);

    // Get all integrations
    const integrations = await ThirdPartyIntegration.find({});
    logger.info(`Found ${integrations.length} integrations to migrate`);

    if (integrations.length === 0) {
      logger.info('No integrations to migrate');
      return;
    }

    // Create backup before migration
    if (!CONFIG.DRY_RUN) {
      await createBackup();
    }

    // Process in batches
    let migrated = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < integrations.length; i += CONFIG.BATCH_SIZE) {
      const batch = integrations.slice(i, i + CONFIG.BATCH_SIZE);

      for (const integration of batch) {
        try {
          const updates = await migrateIntegration(integration);

          if (Object.keys(updates).length > 0) {
            if (CONFIG.DRY_RUN) {
              logger.info(`[DRY RUN] Would update integration: ${integration.name}`, { updates: Object.keys(updates) });
            } else {
              await ThirdPartyIntegration.updateOne(
                { _id: integration._id },
                { $set: updates }
              );
              logger.info(`Migrated integration: ${integration.name}`);
            }
          } else {
            logger.info(`No changes needed for integration: ${integration.name}`);
          }

          migrated++;
        } catch (error) {
          logger.error(`Failed to migrate integration: ${integration.name}`, { error: error.message });
          failed++;
          errors.push({
            integrationId: integration._id,
            name: integration.name,
            error: error.message
          });
        }
      }

      logger.info(`Progress: ${Math.min(i + CONFIG.BATCH_SIZE, integrations.length)}/${integrations.length}`);
    }

    // Migration summary
    logger.info('Migration completed', {
      total: integrations.length,
      migrated,
      failed,
      dryRun: CONFIG.DRY_RUN
    });

    if (errors.length > 0) {
      logger.warn('Migration errors:', { errors });
    }

    return { total: integrations.length, migrated, failed, errors };
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    throw error;
  }
};

/**
 * Verify migration integrity
 */
const verifyMigration = async () => {
  try {
    logger.info('Verifying migration integrity...');

    const integrations = await ThirdPartyIntegration.find({});
    const issues = [];

    for (const integration of integrations) {
      // Check 1: Credentials should be encrypted or null
      if (integration.credentials && typeof integration.credentials === 'object') {
        if (!integration.encryptedCredentials) {
          issues.push({
            integrationId: integration._id,
            name: integration.name,
            issue: 'Credentials not encrypted'
          });
        }
      }

      // Check 2: Required security fields should exist
      const requiredFields = ['allowedIPs', 'allowedRegions', 'mfaRequired', 'complianceTags', 'dataClassification'];
      for (const field of requiredFields) {
        if (integration[field] === undefined) {
          issues.push({
            integrationId: integration._id,
            name: integration.name,
            issue: `Missing required field: ${field}`
          });
        }
      }

      // Check 3: Soft delete fields should exist
      if (integration.isDeleted === undefined) {
        issues.push({
          integrationId: integration._id,
          name: integration.name,
          issue: 'Missing soft delete fields'
        });
      }
    }

    logger.info(`Verification completed: ${issues.length} issues found`);

    if (issues.length > 0) {
      logger.warn('Verification issues:', { issues });
    }

    return issues;
  } catch (error) {
    logger.error('Verification failed', { error: error.message });
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    await connectDB();

    if (CONFIG.ROLLBACK) {
      logger.info('Rollback mode enabled');
      await restoreFromBackup();
    } else {
      const result = await runMigration();

      if (!CONFIG.DRY_RUN) {
        const issues = await verifyMigration();

        if (issues.length === 0 && result.failed === 0) {
          logger.info('Migration completed successfully with no issues');
        } else {
          logger.warn('Migration completed with issues. Review the logs above.');
        }
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error('Migration script failed', { error: error.message });
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigration,
  verifyMigration,
  restoreFromBackup
};
