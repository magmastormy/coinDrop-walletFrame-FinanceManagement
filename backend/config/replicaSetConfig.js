/**
 * MongoDB Replica Set Configuration
 * 
 * Provides configuration and management for MongoDB replica sets
 * to ensure high availability and data redundancy.
 * 
 * @module config/replicaSetConfig
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Replica set configuration
 */
const REPLICA_SET_CONFIG = {
    name: process.env.MONGO_REPLICA_SET_NAME || 'rs0',
    members: [
        {
            _id: 0,
            host: process.env.MONGO_PRIMARY_HOST || 'localhost:27017',
            priority: 2,
            votes: 1,
        },
        {
            _id: 1,
            host: process.env.MONGO_SECONDARY_HOST_1 || 'localhost:27018',
            priority: 1,
            votes: 1,
        },
        {
            _id: 2,
            host: process.env.MONGO_SECONDARY_HOST_2 || 'localhost:27019',
            priority: 1,
            votes: 1,
            arbiterOnly: true,
        },
    ],
    settings: {
        electionTimeoutMillis: 10000,
        heartbeatIntervalMillis: 2000,
        heartbeatTimeoutSecs: 10,
        chainingAllowed: true,
    },
};

/**
 * Connection options for replica set
 */
const REPLICA_SET_OPTIONS = {
    replicaSet: REPLICA_SET_CONFIG.name,
    readPreference: 'secondaryPreferred',
    w: 'majority',
    wtimeoutMS: 5000,
    retryWrites: true,
    maxPoolSize: 50,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
};

/**
 * Replica Set Manager class
 */
class ReplicaSetManager {
    constructor() {
        this.isInitialized = false;
        this.currentPrimary = null;
        this.members = [];
        this.status = null;
    }

    /**
     * Initialize replica set
     */
    async initialize() {
        try {
            logger.info('Initializing replica set manager');

            // Check if we're connected to a replica set
            const isReplicaSet = await this.checkIfReplicaSet();
            
            if (!isReplicaSet) {
                logger.warn('Not connected to a replica set. Running in standalone mode.');
                return false;
            }

            // Get replica set status
            await this.refreshStatus();

            this.isInitialized = true;
            logger.info('Replica set manager initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize replica set manager:', error);
            return false;
        }
    }

    /**
     * Check if connected to a replica set
     */
    async checkIfReplicaSet() {
        try {
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.command({ hello: 1 });
            return result.isreplicaset || result.setName;
        } catch (error) {
            return false;
        }
    }

    /**
     * Refresh replica set status
     */
    async refreshStatus() {
        try {
            const adminDb = mongoose.connection.db.admin();
            this.status = await adminDb.command({ replSetGetStatus: 1 });
            
            this.currentPrimary = this.status.members.find(m => m.stateStr === 'PRIMARY');
            this.members = this.status.members;

            return this.status;
        } catch (error) {
            logger.error('Failed to get replica set status:', error);
            throw error;
        }
    }

    /**
     * Get replica set status
     */
    async getStatus() {
        if (!this.isInitialized) {
            return null;
        }

        try {
            await this.refreshStatus();
            return {
                set: this.status.set,
                date: this.status.date,
                myState: this.status.myState,
                term: this.status.term,
                heartbeatIntervalMillis: this.status.heartbeatIntervalMillis,
                majorityVoteCount: this.status.majorityVoteCount,
                writeMajorityCount: this.status.writeMajorityCount,
                members: this.members.map(m => ({
                    _id: m._id,
                    name: m.name,
                    health: m.health,
                    state: m.state,
                    stateStr: m.stateStr,
                    uptime: m.uptime,
                    optimeDate: m.optimeDate,
                    lastHeartbeat: m.lastHeartbeat,
                    pingMs: m.pingMs,
                    syncSource: m.syncSource,
                    syncSourceHost: m.syncSourceHost,
                })),
                ok: this.status.ok,
            };
        } catch (error) {
            logger.error('Failed to get replica set status:', error);
            return null;
        }
    }

    /**
     * Get primary member
     */
    async getPrimary() {
        if (!this.isInitialized) {
            return null;
        }

        await this.refreshStatus();
        return this.currentPrimary;
    }

    /**
     * Get secondary members
     */
    async getSecondaries() {
        if (!this.isInitialized) {
            return [];
        }

        await this.refreshStatus();
        return this.members.filter(m => m.stateStr === 'SECONDARY');
    }

    /**
     * Get arbiter members
     */
    async getArbiters() {
        if (!this.isInitialized) {
            return [];
        }

        await this.refreshStatus();
        return this.members.filter(m => m.stateStr === 'ARBITER');
    }

    /**
     * Check if replica set is healthy
     */
    async isHealthy() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            const status = await this.getStatus();
            
            if (!status) {
                return false;
            }

            // Check if we have a primary
            const hasPrimary = status.members.some(m => m.stateStr === 'PRIMARY');
            
            // Check if majority of members are healthy
            const healthyMembers = status.members.filter(m => m.health === 1);
            const hasMajority = healthyMembers.length >= status.majorityVoteCount;

            return hasPrimary && hasMajority;
        } catch (error) {
            logger.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Force replica set reconfiguration
     */
    async forceReconfig() {
        try {
            logger.info('Forcing replica set reconfiguration');

            const adminDb = mongoose.connection.db.admin();
            
            // Get current config
            const currentConfig = await adminDb.command({ replSetGetConfig: 1 });
            
            // Increment version
            const newConfig = {
                ...currentConfig.config,
                version: currentConfig.config.version + 1,
            };

            // Apply new config
            await adminDb.command({
                replSetReconfig: newConfig,
                force: true,
            });

            logger.info('Replica set reconfiguration forced');
            return true;
        } catch (error) {
            logger.error('Failed to force replica set reconfiguration:', error);
            throw error;
        }
    }

    /**
     * Step down primary
     */
    async stepDownPrimary(seconds = 60) {
        try {
            logger.info(`Stepping down primary for ${seconds} seconds`);

            const adminDb = mongoose.connection.db.admin();
            await adminDb.command({ replSetStepDown: seconds });

            logger.info('Primary stepped down successfully');
            return true;
        } catch (error) {
            logger.error('Failed to step down primary:', error);
            throw error;
        }
    }

    /**
     * Freeze secondary
     */
    async freezeSecondary(seconds = 60) {
        try {
            logger.info(`Freezing secondary for ${seconds} seconds`);

            const adminDb = mongoose.connection.db.admin();
            await adminDb.command({ replSetFreeze: seconds });

            logger.info('Secondary frozen successfully');
            return true;
        } catch (error) {
            logger.error('Failed to freeze secondary:', error);
            throw error;
        }
    }

    /**
     * Sync from specific host
     */
    async syncFrom(host) {
        try {
            logger.info(`Syncing from ${host}`);

            const adminDb = mongoose.connection.db.admin();
            await adminDb.command({ replSetSyncFrom: host });

            logger.info(`Sync from ${host} initiated`);
            return true;
        } catch (error) {
            logger.error(`Failed to sync from ${host}:`, error);
            throw error;
        }
    }

    /**
     * Get replication lag for all members
     */
    async getReplicationLag() {
        if (!this.isInitialized) {
            return [];
        }

        try {
            await this.refreshStatus();
            
            const primary = this.currentPrimary;
            if (!primary) {
                return [];
            }

            const primaryOptime = primary.optimeDate;
            
            return this.members
                .filter(m => m.stateStr === 'SECONDARY')
                .map(m => {
                    const lag = primaryOptime - m.optimeDate;
                    return {
                        member: m.name,
                        lagSeconds: Math.floor(lag / 1000),
                        lagMilliseconds: lag,
                        health: m.health,
                    };
                });
        } catch (error) {
            logger.error('Failed to get replication lag:', error);
            return [];
        }
    }

    /**
     * Get oplog information
     */
    async getOplogInfo() {
        try {
            const localDb = mongoose.connection.db.collection('oplog.rs');
            
            const [first, last] = await Promise.all([
                localDb.find().sort({ $natural: 1 }).limit(1).toArray(),
                localDb.find().sort({ $natural: -1 }).limit(1).toArray(),
            ]);

            if (first.length === 0 || last.length === 0) {
                return null;
            }

            const firstTimestamp = first[0].ts;
            const lastTimestamp = last[0].ts;
            
            // Calculate oplog window
            const oplogWindow = lastTimestamp.getTime() - firstTimestamp.getTime();

            return {
                firstOperationTime: firstTimestamp,
                lastOperationTime: lastTimestamp,
                oplogWindowHours: Math.floor(oplogWindow / (1000 * 60 * 60)),
                oplogWindowMinutes: Math.floor(oplogWindow / (1000 * 60)),
            };
        } catch (error) {
            logger.error('Failed to get oplog info:', error);
            return null;
        }
    }

    /**
     * Add member to replica set
     */
    async addMember(host, options = {}) {
        try {
            logger.info(`Adding member ${host} to replica set`);

            const adminDb = mongoose.connection.db.admin();
            
            const memberConfig = {
                host,
                priority: options.priority || 1,
                votes: options.votes || 1,
            };

            if (options.arbiterOnly) {
                memberConfig.arbiterOnly = true;
            }

            await adminDb.command({ replSetAdd: memberConfig });

            logger.info(`Member ${host} added successfully`);
            return true;
        } catch (error) {
            logger.error(`Failed to add member ${host}:`, error);
            throw error;
        }
    }

    /**
     * Remove member from replica set
     */
    async removeMember(host) {
        try {
            logger.info(`Removing member ${host} from replica set`);

            const adminDb = mongoose.connection.db.admin();
            await adminDb.command({ replSetRemove: host });

            logger.info(`Member ${host} removed successfully`);
            return true;
        } catch (error) {
            logger.error(`Failed to remove member ${host}:`, error);
            throw error;
        }
    }

    /**
     * Reconfigure replica set member
     */
    async reconfigureMember(host, options) {
        try {
            logger.info(`Reconfiguring member ${host}`);

            const adminDb = mongoose.connection.db.admin();
            const currentConfig = await adminDb.command({ replSetGetConfig: 1 });

            const memberIndex = currentConfig.config.members.findIndex(
                m => m.host === host
            );

            if (memberIndex === -1) {
                throw new Error(`Member ${host} not found in replica set`);
            }

            // Update member configuration
            currentConfig.config.members[memberIndex] = {
                ...currentConfig.config.members[memberIndex],
                ...options,
            };

            // Increment version and apply
            currentConfig.config.version += 1;

            await adminDb.command({
                replSetReconfig: currentConfig.config,
            });

            logger.info(`Member ${host} reconfigured successfully`);
            return true;
        } catch (error) {
            logger.error(`Failed to reconfigure member ${host}:`, error);
            throw error;
        }
    }

    /**
     * Get replica set configuration
     */
    async getConfig() {
        try {
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.command({ replSetGetConfig: 1 });
            return result.config;
        } catch (error) {
            logger.error('Failed to get replica set config:', error);
            return null;
        }
    }

    /**
     * Monitor replica set health
     */
    async monitorHealth(callback, interval = 5000) {
        const monitor = setInterval(async () => {
            try {
                const status = await this.getStatus();
                const isHealthy = await this.isHealthy();
                const lag = await this.getReplicationLag();

                callback({
                    status,
                    isHealthy,
                    lag,
                    timestamp: new Date(),
                });
            } catch (error) {
                logger.error('Health monitoring error:', error);
                callback({
                    error: error.message,
                    timestamp: new Date(),
                });
            }
        }, interval);

        return {
            stop: () => clearInterval(monitor),
        };
    }

    /**
     * Get connection string for replica set
     */
    getConnectionString() {
        const hosts = REPLICA_SET_CONFIG.members
            .filter(m => !m.arbiterOnly)
            .map(m => m.host)
            .join(',');

        return `mongodb://${hosts}/?replicaSet=${REPLICA_SET_CONFIG.name}`;
    }

    /**
     * Get read preference options
     */
    getReadPreferenceOptions(preference = 'secondaryPreferred') {
        return {
            ...REPLICA_SET_OPTIONS,
            readPreference: preference,
        };
    }
}

// Export configuration and manager
module.exports = {
    REPLICA_SET_CONFIG,
    REPLICA_SET_OPTIONS,
    ReplicaSetManager: new ReplicaSetManager(),
};
