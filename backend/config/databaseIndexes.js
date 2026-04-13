const logger = require('../utils/logger');

/**
 * Database Index Management Configuration
 *
 * This module handles the creation and management of database indexes
 * for all MongoDB collections. It ensures indexes are created on application
 * startup and provides utilities for index maintenance.
 *
 * @module config/databaseIndexes
 */

const mongoose = require('mongoose');

/**
 * Logger utility for index operations
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} [meta] - Additional metadata
 */
const logIndexOperation = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };

    switch (level) {
        case 'error':
            logger.error(`[DB Index] ${message}`, meta.error || '');
            break;
        case 'warn':
            logger.warn(`[DB Index] ${message}`, meta);
            break;
        default:
            logger.debug(`[DB Index] ${message}`, meta);
    }
};

/**
 * Index configuration for each model
 * Defines expected indexes and their properties for validation
 */
const indexConfigurations = {
    users: {
        collection: 'users',
        indexes: [
            { key: { email: 1 }, name: 'email_1' },
            { key: { username: 1 }, name: 'username_1' },
            { key: { role: 1 }, name: 'role_1' },
            { key: { isVerified: 1 }, name: 'isVerified_1' },
            { key: { lastLogin: -1 }, name: 'lastLogin_-1' },
            { key: { role: 1, createdAt: -1 }, name: 'role_1_createdAt_-1' },
            { key: { isVerified: 1, createdAt: -1 }, name: 'isVerified_1_createdAt_-1' },
            { key: { lastLogin: 1 }, name: 'lastLogin_1', sparse: true },
            {
                key: { username: 'text', email: 'text', firstName: 'text', lastName: 'text' },
                name: 'user_text_search',
                default_language: 'english'
            }
        ]
    },
    transactions: {
        collection: 'transactions',
        indexes: [
            { key: { userId: 1, date: -1 }, name: 'userId_1_date_-1' },
            { key: { userId: 1, type: 1 }, name: 'userId_1_type_1' },
            { key: { categoryId: 1, date: -1 }, name: 'categoryId_1_date_-1' },
            { key: { type: 1, date: -1 }, name: 'type_1_date_-1' },
            { key: { userId: 1, categoryId: 1, date: -1 }, name: 'userId_1_categoryId_1_date_-1' },
            { key: { userId: 1, isRecurring: 1 }, name: 'userId_1_isRecurring_1' },
            { key: { date: -1 }, name: 'date_-1' },
            { key: { createdAt: -1 }, name: 'createdAt_-1' },
            {
                key: { description: 'text', tags: 'text' },
                name: 'transaction_text_search',
                default_language: 'english'
            }
        ]
    },
    categories: {
        collection: 'categories',
        indexes: [
            { key: { userId: 1, type: 1 }, name: 'userId_1_type_1' },
            { key: { userId: 1, name: 1 }, name: 'userId_1_name_1' },
            { key: { parentId: 1 }, name: 'parentId_1' },
            { key: { userId: 1, isActive: 1 }, name: 'userId_1_isActive_1' },
            { key: { isDefault: 1, type: 1 }, name: 'isDefault_1_type_1' },
            {
                key: { name: 'text', description: 'text' },
                name: 'category_text_search',
                default_language: 'english'
            }
        ]
    },
    auditlogs: {
        collection: 'auditlogs',
        indexes: [
            { key: { adminId: 1 }, name: 'adminId_1' },
            { key: { entityType: 1, entityId: 1 }, name: 'entityType_1_entityId_1' },
            { key: { timestamp: -1 }, name: 'timestamp_-1' },
            { key: { action: 1 }, name: 'action_1' },
            { key: { adminId: 1, timestamp: -1 }, name: 'adminId_1_timestamp_-1' },
            { key: { status: 1, timestamp: -1 }, name: 'status_1_timestamp_-1' },
            { key: { entityType: 1, entityId: 1, timestamp: -1 }, name: 'entityType_1_entityId_1_timestamp_-1' },
            {
                key: { timestamp: 1 },
                name: 'audit_log_ttl_index',
                expireAfterSeconds: 31536000 // 365 days
            }
        ]
    }
};

/**
 * Setup indexes for a specific collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} expectedIndexes - Array of expected index configurations
 * @returns {Promise<Object>} Result of index setup
 */
const setupCollectionIndexes = async (collectionName, expectedIndexes) => {
    const results = {
        collection: collectionName,
        created: [],
        existing: [],
        errors: []
    };

    try {
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Get existing indexes
        const existingIndexes = await collection.indexes();
        const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));

        // Create missing indexes
        for (const indexConfig of expectedIndexes) {
            try {
                if (!existingIndexNames.has(indexConfig.name)) {
                    const indexSpec = { ...indexConfig };
                    delete indexSpec.name;

                    await collection.createIndex(indexSpec.key, {
                        name: indexConfig.name,
                        sparse: indexConfig.sparse || false,
                        default_language: indexConfig.default_language,
                        expireAfterSeconds: indexConfig.expireAfterSeconds,
                        weights: indexConfig.weights
                    });

                    results.created.push(indexConfig.name);
                    logIndexOperation('info', `Created index: ${indexConfig.name}`, {
                        collection: collectionName
                    });
                } else {
                    results.existing.push(indexConfig.name);
                }
            } catch (error) {
                results.errors.push({
                    index: indexConfig.name,
                    error: error.message
                });
                logIndexOperation('error', `Failed to create index: ${indexConfig.name}`, {
                    collection: collectionName,
                    error: error.message
                });
            }
        }
    } catch (error) {
        results.errors.push({
            general: true,
            error: error.message
        });
        logIndexOperation('error', `Failed to setup indexes for ${collectionName}`, {
            error: error.message
        });
    }

    return results;
};

/**
 * Main function to setup all database indexes
 * Should be called on application startup
 * @param {Object} options - Configuration options
 * @param {boolean} [options.forceRecreate=false] - Force recreation of indexes
 * @param {Array<string>} [options.collections] - Specific collections to setup (default: all)
 * @returns {Promise<Object>} Summary of index setup results
 */
const setupIndexes = async (options = {}) => {
    const { forceRecreate = false, collections } = options;

    logIndexOperation('info', 'Starting database index setup...');

    const results = {
        success: true,
        timestamp: new Date(),
        collections: {},
        summary: {
            totalCreated: 0,
            totalExisting: 0,
            totalErrors: 0
        }
    };

    try {
        // Ensure database connection is established
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection not established');
        }

        // Determine which collections to process
        const collectionsToProcess = collections
            ? Object.keys(indexConfigurations).filter(key => collections.includes(key))
            : Object.keys(indexConfigurations);

        // Process each collection
        for (const collectionKey of collectionsToProcess) {
            const config = indexConfigurations[collectionKey];

            // If force recreate, drop existing indexes first (except _id)
            if (forceRecreate) {
                try {
                    const db = mongoose.connection.db;
                    const collection = db.collection(config.collection);
                    const existingIndexes = await collection.indexes();

                    for (const index of existingIndexes) {
                        if (index.name !== '_id_') {
                            await collection.dropIndex(index.name);
                            logIndexOperation('info', `Dropped index: ${index.name}`, {
                                collection: config.collection
                            });
                        }
                    }
                } catch (error) {
                    logIndexOperation('warn', `Could not drop indexes for ${config.collection}`, {
                        error: error.message
                    });
                }
            }

            const collectionResult = await setupCollectionIndexes(
                config.collection,
                config.indexes
            );

            results.collections[collectionKey] = collectionResult;
            results.summary.totalCreated += collectionResult.created.length;
            results.summary.totalExisting += collectionResult.existing.length;
            results.summary.totalErrors += collectionResult.errors.length;
        }

        // Determine overall success
        results.success = results.summary.totalErrors === 0;

        logIndexOperation('info', 'Database index setup completed', {
            created: results.summary.totalCreated,
            existing: results.summary.totalExisting,
            errors: results.summary.totalErrors
        });

    } catch (error) {
        results.success = false;
        results.error = error.message;
        logIndexOperation('error', 'Database index setup failed', {
            error: error.message
        });
    }

    return results;
};

/**
 * Verify that all expected indexes exist
 * @returns {Promise<Object>} Verification results
 */
const verifyIndexes = async () => {
    const results = {
        success: true,
        timestamp: new Date(),
        collections: {},
        missing: []
    };

    try {
        const db = mongoose.connection.db;

        for (const [key, config] of Object.entries(indexConfigurations)) {
            const collection = db.collection(config.collection);
            const existingIndexes = await collection.indexes();
            const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));

            const collectionStatus = {
                collection: config.collection,
                expected: config.indexes.length,
                found: 0,
                missing: []
            };

            for (const indexConfig of config.indexes) {
                if (existingIndexNames.has(indexConfig.name)) {
                    collectionStatus.found++;
                } else {
                    collectionStatus.missing.push(indexConfig.name);
                    results.missing.push({
                        collection: config.collection,
                        index: indexConfig.name
                    });
                }
            }

            results.collections[key] = collectionStatus;
        }

        results.success = results.missing.length === 0;

    } catch (error) {
        results.success = false;
        results.error = error.message;
    }

    return results;
};

/**
 * Get index statistics for all collections
 * @returns {Promise<Object>} Index statistics
 */
const getIndexStats = async () => {
    const results = {
        timestamp: new Date(),
        collections: {}
    };

    try {
        const db = mongoose.connection.db;

        for (const [key, config] of Object.entries(indexConfigurations)) {
            const collection = db.collection(config.collection);
            const stats = await collection.stats();
            const indexes = await collection.indexes();

            results.collections[key] = {
                collection: config.collection,
                documentCount: stats.count,
                indexCount: indexes.length,
                indexSizes: indexes.map(idx => ({
                    name: idx.name,
                    size: idx.size || 'N/A'
                })),
                totalIndexSize: stats.totalIndexSize
            };
        }

    } catch (error) {
        results.error = error.message;
    }

    return results;
};

/**
 * Rebuild a specific index
 * @param {string} collectionName - Name of the collection
 * @param {string} indexName - Name of the index to rebuild
 * @returns {Promise<Object>} Rebuild result
 */
const rebuildIndex = async (collectionName, indexName) => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Drop the index
        await collection.dropIndex(indexName);

        // Find the index configuration
        let indexConfig = null;
        for (const config of Object.values(indexConfigurations)) {
            if (config.collection === collectionName) {
                indexConfig = config.indexes.find(idx => idx.name === indexName);
                break;
            }
        }

        if (!indexConfig) {
            throw new Error(`Index configuration not found for ${indexName}`);
        }

        // Recreate the index
        const indexSpec = { ...indexConfig };
        delete indexSpec.name;

        await collection.createIndex(indexSpec.key, {
            name: indexConfig.name,
            sparse: indexConfig.sparse || false,
            default_language: indexConfig.default_language,
            expireAfterSeconds: indexConfig.expireAfterSeconds,
            weights: indexConfig.weights
        });

        return {
            success: true,
            collection: collectionName,
            index: indexName,
            message: 'Index rebuilt successfully'
        };

    } catch (error) {
        return {
            success: false,
            collection: collectionName,
            index: indexName,
            error: error.message
        };
    }
};

module.exports = {
    setupIndexes,
    verifyIndexes,
    getIndexStats,
    rebuildIndex,
    indexConfigurations
};
