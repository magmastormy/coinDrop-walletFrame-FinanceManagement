/**
 * Audit Integrity Service
 * 
 * Provides cryptographic tamper-proofing for audit logs using
 * blockchain-like chaining, digital signatures, and integrity verification.
 * 
 * @module services/auditIntegrityService
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Audit integrity configuration
 */
const INTEGRITY_CONFIG = {
    hashAlgorithm: 'sha256',
    signatureAlgorithm: 'RSA-SHA256',
    chainAlgorithm: 'sha256',
    blockSize: 100, // Number of logs per block
    verificationInterval: 60000, // 1 minute
    autoVerify: process.env.AUDIT_AUTO_VERIFY !== 'false',
};

/**
 * Audit Block Schema for blockchain-like chaining
 */
const AuditBlockSchema = new mongoose.Schema({
    blockNumber: {
        type: Number,
        required: true,
        unique: true,
        index: true,
    },
    previousHash: {
        type: String,
        required: true,
    },
    merkleRoot: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    },
    logCount: {
        type: Number,
        required: true,
    },
    firstLogId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    lastLogId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    signature: {
        type: String,
        default: null,
    },
    nonce: {
        type: Number,
        default: 0,
    },
    difficulty: {
        type: Number,
        default: 2,
    },
}, {
    timestamps: true,
});

// Index for efficient querying
AuditBlockSchema.index({ blockNumber: -1 });
AuditBlockSchema.index({ timestamp: -1 });

const AuditBlock = mongoose.model('AuditBlock', AuditBlockSchema);

/**
 * Audit Integrity Service class
 */
class AuditIntegrityService {
    constructor() {
        this.privateKey = process.env.AUDIT_PRIVATE_KEY;
        this.publicKey = process.env.AUDIT_PUBLIC_KEY;
        this.currentBlock = null;
        this.pendingLogs = [];
        this.verificationTimer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize audit integrity service
     */
    async initialize() {
        try {
            logger.info('Initializing audit integrity service');

            // Load or create genesis block
            await this.loadOrCreateGenesisBlock();

            // Start automatic verification if enabled
            if (INTEGRITY_CONFIG.autoVerify) {
                this.startAutomaticVerification();
            }

            this.isInitialized = true;
            logger.info('Audit integrity service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize audit integrity service:', error);
            throw error;
        }
    }

    /**
     * Load or create genesis block
     */
    async loadOrCreateGenesisBlock() {
        try {
            const latestBlock = await AuditBlock.findOne().sort({ blockNumber: -1 });

            if (latestBlock) {
                this.currentBlock = latestBlock;
                logger.info(`Loaded latest audit block: ${latestBlock.blockNumber}`);
            } else {
                // Create genesis block
                const genesisBlock = await this.createGenesisBlock();
                this.currentBlock = genesisBlock;
                logger.info('Created genesis audit block');
            }
        } catch (error) {
            logger.error('Failed to load or create genesis block:', error);
            throw error;
        }
    }

    /**
     * Create genesis block
     */
    async createGenesisBlock() {
        const genesisBlock = new AuditBlock({
            blockNumber: 0,
            previousHash: '0'.repeat(64),
            merkleRoot: this.calculateHash('genesis'),
            timestamp: new Date(),
            logCount: 0,
            firstLogId: new mongoose.Types.ObjectId(),
            lastLogId: new mongoose.Types.ObjectId(),
            nonce: 0,
        });

        // Sign genesis block if keys are available
        if (this.privateKey) {
            genesisBlock.signature = this.signBlock(genesisBlock);
        }

        await genesisBlock.save();
        return genesisBlock;
    }

    /**
     * Calculate hash using configured algorithm
     */
    calculateHash(data) {
        const hash = crypto.createHash(INTEGRITY_CONFIG.hashAlgorithm);
        
        if (typeof data === 'string') {
            hash.update(data);
        } else if (Buffer.isBuffer(data)) {
            hash.update(data);
        } else {
            hash.update(JSON.stringify(data));
        }
        
        return hash.digest('hex');
    }

    /**
     * Calculate Merkle root from array of log hashes
     */
    calculateMerkleRoot(hashes) {
        if (hashes.length === 0) {
            return this.calculateHash('');
        }

        if (hashes.length === 1) {
            return hashes[0];
        }

        // Build tree level by level
        let currentLevel = [...hashes];

        while (currentLevel.length > 1) {
            const nextLevel = [];

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || left; // Duplicate last hash if odd
                const combined = this.calculateHash(left + right);
                nextLevel.push(combined);
            }

            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }

    /**
     * Sign a block with private key
     */
    signBlock(block) {
        if (!this.privateKey) {
            return null;
        }

        try {
            const signer = crypto.createSign(INTEGRITY_CONFIG.signatureAlgorithm);
            const blockData = this.getBlockDataForSigning(block);
            signer.update(blockData);
            return signer.sign(this.privateKey, 'hex');
        } catch (error) {
            logger.error('Failed to sign block:', error);
            return null;
        }
    }

    /**
     * Verify block signature
     */
    verifyBlockSignature(block) {
        if (!this.publicKey || !block.signature) {
            return true; // No signature to verify
        }

        try {
            const verifier = crypto.createVerify(INTEGRITY_CONFIG.signatureAlgorithm);
            const blockData = this.getBlockDataForSigning(block);
            verifier.update(blockData);
            return verifier.verify(this.publicKey, block.signature, 'hex');
        } catch (error) {
            logger.error('Failed to verify block signature:', error);
            return false;
        }
    }

    /**
     * Get block data for signing
     */
    getBlockDataForSigning(block) {
        return JSON.stringify({
            blockNumber: block.blockNumber,
            previousHash: block.previousHash,
            merkleRoot: block.merkleRoot,
            timestamp: block.timestamp,
            logCount: block.logCount,
            firstLogId: block.firstLogId,
            lastLogId: block.lastLogId,
            nonce: block.nonce,
        });
    }

    /**
     * Mine block (proof of work)
     */
    async mineBlock(block) {
        const target = '0'.repeat(block.difficulty);
        
        while (true) {
            const blockHash = this.calculateHash(this.getBlockDataForSigning(block));
            
            if (blockHash.startsWith(target)) {
                return block;
            }
            
            block.nonce++;
            
            // Prevent infinite mining in development
            if (block.nonce > 1000000) {
                logger.warn('Mining difficulty too high, skipping proof of work');
                return block;
            }
        }
    }

    /**
     * Add audit log to pending queue
     */
    async addAuditLog(logData) {
        if (!this.isInitialized) {
            throw new Error('Audit integrity service not initialized');
        }

        // Calculate log hash
        const logHash = this.calculateAuditLogHash(logData);
        
        // Add to pending logs
        this.pendingLogs.push({
            logId: logData._id,
            hash: logHash,
            timestamp: new Date(),
        });

        // Check if we need to create a new block
        if (this.pendingLogs.length >= INTEGRITY_CONFIG.blockSize) {
            await this.createNewBlock();
        }

        return logHash;
    }

    /**
     * Calculate audit log hash
     */
    calculateAuditLogHash(logData) {
        const data = {
            _id: logData._id.toString(),
            adminId: logData.adminId.toString(),
            action: logData.action,
            entityType: logData.entityType,
            entityId: logData.entityId ? logData.entityId.toString() : null,
            changes: logData.changes,
            metadata: logData.metadata,
            timestamp: logData.timestamp,
            status: logData.status,
        };

        return this.calculateHash(data);
    }

    /**
     * Create new block from pending logs
     */
    async createNewBlock() {
        if (this.pendingLogs.length === 0) {
            return;
        }

        try {
            // Calculate Merkle root
            const logHashes = this.pendingLogs.map(log => log.hash);
            const merkleRoot = this.calculateMerkleRoot(logHashes);

            // Create new block
            const newBlock = new AuditBlock({
                blockNumber: this.currentBlock.blockNumber + 1,
                previousHash: this.calculateHash(this.currentBlock.toObject()),
                merkleRoot,
                timestamp: new Date(),
                logCount: this.pendingLogs.length,
                firstLogId: this.pendingLogs[0].logId,
                lastLogId: this.pendingLogs[this.pendingLogs.length - 1].logId,
                difficulty: this.currentBlock.difficulty,
                nonce: 0,
            });

            // Mine block (optional proof of work)
            await this.mineBlock(newBlock);

            // Sign block
            if (this.privateKey) {
                newBlock.signature = this.signBlock(newBlock);
            }

            // Save block
            await newBlock.save();

            // Update current block
            this.currentBlock = newBlock;

            // Clear pending logs
            this.pendingLogs = [];

            logger.info(`Created new audit block: ${newBlock.blockNumber}`, {
                logCount: newBlock.logCount,
                merkleRoot: newBlock.merkleRoot,
            });

            return newBlock;
        } catch (error) {
            logger.error('Failed to create new audit block:', error);
            throw error;
        }
    }

    /**
     * Verify integrity of all audit blocks
     */
    async verifyIntegrity() {
        try {
            logger.info('Starting audit integrity verification');

            const blocks = await AuditBlock.find().sort({ blockNumber: 1 });
            const issues = [];

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const issuesForBlock = await this.verifyBlock(block, i > 0 ? blocks[i - 1] : null);
                
                if (issuesForBlock.length > 0) {
                    issues.push({
                        blockNumber: block.blockNumber,
                        issues: issuesForBlock,
                    });
                }
            }

            const result = {
                verified: issues.length === 0,
                totalBlocks: blocks.length,
                issues,
                timestamp: new Date(),
            };

            if (result.verified) {
                logger.info('Audit integrity verification passed');
            } else {
                logger.error('Audit integrity verification failed', { issues });
            }

            return result;
        } catch (error) {
            logger.error('Audit integrity verification error:', error);
            throw error;
        }
    }

    /**
     * Verify individual block
     */
    async verifyBlock(block, previousBlock) {
        const issues = [];

        // Verify previous hash
        if (previousBlock) {
            const expectedPreviousHash = this.calculateHash(previousBlock.toObject());
            if (block.previousHash !== expectedPreviousHash) {
                issues.push({
                    type: 'previous_hash_mismatch',
                    expected: expectedPreviousHash,
                    actual: block.previousHash,
                });
            }
        }

        // Verify signature
        if (block.signature && !this.verifyBlockSignature(block)) {
            issues.push({
                type: 'invalid_signature',
                blockNumber: block.blockNumber,
            });
        }

        // Verify Merkle root by checking actual logs
        if (block.logCount > 0) {
            const AuditLog = mongoose.model('AuditLog');
            const logs = await AuditLog.find({
                _id: { $gte: block.firstLogId, $lte: block.lastLogId },
            }).sort({ _id: 1 });

            const logHashes = logs.map(log => this.calculateAuditLogHash(log));
            const expectedMerkleRoot = this.calculateMerkleRoot(logHashes);

            if (block.merkleRoot !== expectedMerkleRoot) {
                issues.push({
                    type: 'merkle_root_mismatch',
                    expected: expectedMerkleRoot,
                    actual: block.merkleRoot,
                });
            }
        }

        return issues;
    }

    /**
     * Verify specific audit log
     */
    async verifyAuditLog(logId) {
        try {
            const AuditLog = mongoose.model('AuditLog');
            const log = await AuditLog.findById(logId);

            if (!log) {
                return {
                    verified: false,
                    error: 'Audit log not found',
                };
            }

            // Find block containing this log
            const block = await AuditBlock.findOne({
                firstLogId: { $lte: logId },
                lastLogId: { $gte: logId },
            });

            if (!block) {
                return {
                    verified: false,
                    error: 'Audit log not found in any block',
                };
            }

            // Verify log is in block
            const logs = await AuditLog.find({
                _id: { $gte: block.firstLogId, $lte: block.lastLogId },
            }).sort({ _id: 1 });

            const logHashes = logs.map(l => this.calculateAuditLogHash(l));
            const expectedMerkleRoot = this.calculateMerkleRoot(logHashes);

            return {
                verified: block.merkleRoot === expectedMerkleRoot,
                blockNumber: block.blockNumber,
                merkleRoot: block.merkleRoot,
                expectedMerkleRoot,
            };
        } catch (error) {
            logger.error('Failed to verify audit log:', error);
            return {
                verified: false,
                error: error.message,
            };
        }
    }

    /**
     * Start automatic verification
     */
    startAutomaticVerification() {
        if (this.verificationTimer) {
            clearInterval(this.verificationTimer);
        }

        this.verificationTimer = setInterval(
            () => this.verifyIntegrity(),
            INTEGRITY_CONFIG.verificationInterval
        );

        logger.info('Automatic audit verification started');
    }

    /**
     * Stop automatic verification
     */
    stopAutomaticVerification() {
        if (this.verificationTimer) {
            clearInterval(this.verificationTimer);
            this.verificationTimer = null;
        }

        logger.info('Automatic audit verification stopped');
    }

    /**
     * Get audit chain statistics
     */
    async getChainStats() {
        try {
            const totalBlocks = await AuditBlock.countDocuments();
            const latestBlock = await AuditBlock.findOne().sort({ blockNumber: -1 });
            
            return {
                totalBlocks,
                latestBlockNumber: latestBlock ? latestBlock.blockNumber : 0,
                pendingLogs: this.pendingLogs.length,
                isInitialized: this.isInitialized,
                autoVerify: INTEGRITY_CONFIG.autoVerify,
                blockSize: INTEGRITY_CONFIG.blockSize,
            };
        } catch (error) {
            logger.error('Failed to get chain stats:', error);
            return null;
        }
    }

    /**
     * Get block by number
     */
    async getBlock(blockNumber) {
        try {
            return await AuditBlock.findOne({ blockNumber });
        } catch (error) {
            logger.error(`Failed to get block ${blockNumber}:`, error);
            return null;
        }
    }

    /**
     * Get recent blocks
     */
    async getRecentBlocks(limit = 10) {
        try {
            return await AuditBlock.find()
                .sort({ blockNumber: -1 })
                .limit(limit);
        } catch (error) {
            logger.error('Failed to get recent blocks:', error);
            return [];
        }
    }

    /**
     * Generate integrity report
     */
    async generateIntegrityReport() {
        try {
            const verification = await this.verifyIntegrity();
            const stats = await this.getChainStats();

            return {
                timestamp: new Date(),
                verification,
                stats,
                configuration: {
                    hashAlgorithm: INTEGRITY_CONFIG.hashAlgorithm,
                    signatureAlgorithm: INTEGRITY_CONFIG.signatureAlgorithm,
                    blockSize: INTEGRITY_CONFIG.blockSize,
                    autoVerify: INTEGRITY_CONFIG.autoVerify,
                },
            };
        } catch (error) {
            logger.error('Failed to generate integrity report:', error);
            return null;
        }
    }

    /**
     * Shutdown service
     */
    async shutdown() {
        this.stopAutomaticVerification();
        
        // Create final block with any pending logs
        if (this.pendingLogs.length > 0) {
            await this.createNewBlock();
        }

        logger.info('Audit integrity service shutdown');
    }
}

// Export singleton instance
module.exports = new AuditIntegrityService();
