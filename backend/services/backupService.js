/**
 * Backup Service
 * 
 * Provides automated backup functionality for MongoDB databases
 * with encryption, compression, and verification capabilities.
 * 
 * @module services/backupService
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const execAsync = promisify(exec);
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

/**
 * Backup configuration
 */
const BACKUP_CONFIG = {
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    compressionLevel: 9,
    encryptionAlgorithm: 'aes-256-gcm',
    schedule: {
        fullBackup: '0 2 * * *', // Daily at 2 AM
        incrementalBackup: '0 */6 * * *', // Every 6 hours
    },
    verificationEnabled: true,
    cloudSyncEnabled: process.env.CLOUD_BACKUP_ENABLED === 'true',
};

/**
 * Backup metadata schema
 */
class BackupMetadata {
    constructor(data = {}) {
        this.id = data.id || this.generateBackupId();
        this.timestamp = data.timestamp || new Date();
        this.type = data.type || 'full';
        this.database = data.database || process.env.MONGODB_DB_NAME || 'coindrop';
        this.size = data.size || 0;
        this.compressedSize = data.compressedSize || 0;
        this.checksum = data.checksum || '';
        this.encrypted = data.encrypted || false;
        this.collections = data.collections || [];
        this.duration = data.duration || 0;
        this.status = data.status || 'pending';
        this.error = data.error || null;
        this.verificationStatus = data.verificationStatus || 'pending';
        this.storageLocations = data.storageLocations || [];
    }

    generateBackupId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = crypto.randomBytes(4).toString('hex');
        return `backup-${timestamp}-${random}`;
    }

    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            type: this.type,
            database: this.database,
            size: this.size,
            compressedSize: this.compressedSize,
            checksum: this.checksum,
            encrypted: this.encrypted,
            collections: this.collections,
            duration: this.duration,
            status: this.status,
            error: this.error,
            verificationStatus: this.verificationStatus,
            storageLocations: this.storageLocations,
        };
    }
}

/**
 * Backup Service class
 */
class BackupService {
    constructor() {
        this.backupDir = BACKUP_CONFIG.backupDir;
        this.metadataFile = path.join(this.backupDir, 'backup-metadata.json');
        this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
        this.isRunning = false;
        this.scheduledJobs = [];
    }

    /**
     * Initialize backup service
     */
    async initialize() {
        try {
            // Ensure backup directory exists
            await this.ensureBackupDirectory();
            
            // Load existing metadata
            await this.loadMetadata();
            
            logger.info('Backup service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize backup service:', error);
            throw error;
        }
    }

    /**
     * Ensure backup directory exists
     */
    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            logger.info(`Backup directory ensured: ${this.backupDir}`);
        } catch (error) {
            logger.error('Failed to create backup directory:', error);
            throw error;
        }
    }

    /**
     * Load backup metadata
     */
    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            this.metadata = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, start with empty metadata
            this.metadata = {
                backups: [],
                lastBackup: null,
                totalBackups: 0,
            };
        }
    }

    /**
     * Save backup metadata
     */
    async saveMetadata() {
        try {
            await fs.writeFile(
                this.metadataFile,
                JSON.stringify(this.metadata, null, 2),
                'utf8'
            );
        } catch (error) {
            logger.error('Failed to save backup metadata:', error);
            throw error;
        }
    }

    /**
     * Create a full database backup
     */
    async createFullBackup() {
        if (this.isRunning) {
            throw new Error('Backup already in progress');
        }

        this.isRunning = true;
        const startTime = Date.now();
        const metadata = new BackupMetadata({ type: 'full' });

        try {
            logger.info(`Starting full backup: ${metadata.id}`);

            // Create backup directory for this backup
            const backupPath = path.join(this.backupDir, metadata.id);
            await fs.mkdir(backupPath, { recursive: true });

            // Get database connection info
            const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coindrop';
            const dbName = process.env.MONGODB_DB_NAME || 'coindrop';

            // Perform MongoDB dump
            const dumpPath = path.join(backupPath, 'dump');
            await this.performMongoDump(dbUri, dbName, dumpPath);

            // Get list of collections
            metadata.collections = await this.getCollectionList(dbName);

            // Calculate original size
            metadata.size = await this.calculateDirectorySize(dumpPath);

            // Compress backup
            const compressedPath = await this.compressBackup(dumpPath, backupPath);
            metadata.compressedSize = (await fs.stat(compressedPath)).size;

            // Encrypt backup if key is available
            if (this.encryptionKey) {
                const encryptedPath = await this.encryptBackup(compressedPath, backupPath);
                metadata.encrypted = true;
                
                // Remove unencrypted compressed file
                await fs.unlink(compressedPath);
                
                // Calculate checksum of encrypted file
                metadata.checksum = await this.calculateChecksum(encryptedPath);
            } else {
                // Calculate checksum of compressed file
                metadata.checksum = await this.calculateChecksum(compressedPath);
            }

            // Clean up raw dump directory
            await this.removeDirectory(dumpPath);

            // Verify backup if enabled
            if (BACKUP_CONFIG.verificationEnabled) {
                metadata.verificationStatus = await this.verifyBackup(metadata);
            }

            // Update metadata
            metadata.duration = Date.now() - startTime;
            metadata.status = 'completed';
            metadata.storageLocations.push({
                type: 'local',
                path: backupPath,
                timestamp: new Date(),
            });

            // Sync to cloud if enabled
            if (BACKUP_CONFIG.cloudSyncEnabled) {
                await this.syncToCloud(metadata);
            }

            // Save metadata
            this.metadata.backups.push(metadata.toJSON());
            this.metadata.lastBackup = metadata.timestamp;
            this.metadata.totalBackups++;
            await this.saveMetadata();

            // Clean up old backups
            await this.cleanupOldBackups();

            logger.info(`Full backup completed: ${metadata.id}`, {
                duration: metadata.duration,
                size: metadata.size,
                compressedSize: metadata.compressedSize,
            });

            return metadata;
        } catch (error) {
            metadata.status = 'failed';
            metadata.error = error.message;
            logger.error(`Full backup failed: ${metadata.id}`, error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Perform MongoDB dump
     */
    async performMongoDump(uri, dbName, outputPath) {
        try {
            const command = `mongodump --uri="${uri}" --db=${dbName} --out="${outputPath}" --gzip`;
            
            logger.info(`Executing MongoDB dump: ${command}`);
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('done dumping')) {
                logger.warn('MongoDB dump warnings:', stderr);
            }
            
            logger.info('MongoDB dump completed successfully');
        } catch (error) {
            logger.error('MongoDB dump failed:', error);
            throw new Error(`Failed to create MongoDB dump: ${error.message}`);
        }
    }

    /**
     * Get list of collections from database
     */
    async getCollectionList(dbName) {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            return collections.map(col => col.name);
        } catch (error) {
            logger.error('Failed to get collection list:', error);
            return [];
        }
    }

    /**
     * Calculate directory size
     */
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                
                if (file.isDirectory()) {
                    totalSize += await this.calculateDirectorySize(filePath);
                } else {
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            logger.error(`Failed to calculate directory size: ${dirPath}`, error);
        }
        
        return totalSize;
    }

    /**
     * Compress backup directory
     */
    async compressBackup(sourcePath, backupPath) {
        try {
            const outputFile = path.join(backupPath, 'backup.tar.gz');
            const command = `tar -czf "${outputFile}" -C "${path.dirname(sourcePath)}" "${path.basename(sourcePath)}"`;
            
            logger.info(`Compressing backup: ${outputFile}`);
            await execAsync(command);
            
            logger.info('Backup compression completed');
            return outputFile;
        } catch (error) {
            logger.error('Backup compression failed:', error);
            throw error;
        }
    }

    /**
     * Encrypt backup file
     */
    async encryptBackup(inputPath, backupPath) {
        try {
            const outputFile = path.join(backupPath, 'backup.encrypted');
            
            // Read input file
            const data = await fs.readFile(inputPath);
            
            // Generate IV
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
            const cipher = crypto.createCipheriv(BACKUP_CONFIG.encryptionAlgorithm, key, iv);
            
            // Encrypt data
            const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
            const authTag = cipher.getAuthTag();
            
            // Write encrypted file with IV and auth tag
            const output = Buffer.concat([iv, authTag, encrypted]);
            await fs.writeFile(outputFile, output);
            
            logger.info('Backup encryption completed');
            return outputFile;
        } catch (error) {
            logger.error('Backup encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt backup file
     */
    async decryptBackup(inputPath, outputPath) {
        try {
            // Read encrypted file
            const data = await fs.readFile(inputPath);
            
            // Extract IV, auth tag, and encrypted data
            const iv = data.slice(0, 16);
            const authTag = data.slice(16, 32);
            const encrypted = data.slice(32);
            
            // Create decipher
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
            const decipher = crypto.createDecipheriv(BACKUP_CONFIG.encryptionAlgorithm, key, iv);
            decipher.setAuthTag(authTag);
            
            // Decrypt data
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            
            // Write decrypted file
            await fs.writeFile(outputPath, decrypted);
            
            logger.info('Backup decryption completed');
            return outputPath;
        } catch (error) {
            logger.error('Backup decryption failed:', error);
            throw error;
        }
    }

    /**
     * Calculate file checksum
     */
    async calculateChecksum(filePath) {
        try {
            const hash = crypto.createHash('sha256');
            const data = await fs.readFile(filePath);
            hash.update(data);
            return hash.digest('hex');
        } catch (error) {
            logger.error('Checksum calculation failed:', error);
            throw error;
        }
    }

    /**
     * Verify backup integrity
     */
    async verifyBackup(metadata) {
        try {
            logger.info(`Verifying backup: ${metadata.id}`);
            
            const backupPath = path.join(this.backupDir, metadata.id);
            const backupFile = metadata.encrypted
                ? path.join(backupPath, 'backup.encrypted')
                : path.join(backupPath, 'backup.tar.gz');
            
            // Verify file exists
            await fs.access(backupFile);
            
            // Verify checksum
            const currentChecksum = await this.calculateChecksum(backupFile);
            if (currentChecksum !== metadata.checksum) {
                throw new Error('Backup checksum mismatch');
            }
            
            // If encrypted, test decryption
            if (metadata.encrypted) {
                const tempPath = path.join(backupPath, 'temp-verify.tar.gz');
                await this.decryptBackup(backupFile, tempPath);
                await fs.unlink(tempPath);
            }
            
            logger.info(`Backup verification passed: ${metadata.id}`);
            return 'passed';
        } catch (error) {
            logger.error(`Backup verification failed: ${metadata.id}`, error);
            return 'failed';
        }
    }

    /**
     * Sync backup to cloud storage
     */
    async syncToCloud(metadata) {
        // Placeholder for cloud sync implementation
        // This would integrate with AWS S3, Azure Blob, or Google Cloud Storage
        logger.info(`Cloud sync not implemented for backup: ${metadata.id}`);
    }

    /**
     * Clean up old backups
     */
    async cleanupOldBackups() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
            
            const backupsToDelete = this.metadata.backups.filter(
                backup => new Date(backup.timestamp) < cutoffDate
            );
            
            for (const backup of backupsToDelete) {
                const backupPath = path.join(this.backupDir, backup.id);
                
                try {
                    await this.removeDirectory(backupPath);
                    logger.info(`Deleted old backup: ${backup.id}`);
                } catch (error) {
                    logger.error(`Failed to delete old backup: ${backup.id}`, error);
                }
            }
            
            // Update metadata
            this.metadata.backups = this.metadata.backups.filter(
                backup => new Date(backup.timestamp) >= cutoffDate
            );
            
            await this.saveMetadata();
        } catch (error) {
            logger.error('Backup cleanup failed:', error);
        }
    }

    /**
     * Remove directory recursively
     */
    async removeDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                
                if (file.isDirectory()) {
                    await this.removeDirectory(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
            
            await fs.rmdir(dirPath);
        } catch (error) {
            // Directory might not exist
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    /**
     * Restore from backup
     */
    async restoreBackup(backupId, targetDbUri = null) {
        try {
            logger.info(`Starting restore from backup: ${backupId}`);
            
            const backup = this.metadata.backups.find(b => b.id === backupId);
            if (!backup) {
                throw new Error(`Backup not found: ${backupId}`);
            }
            
            const backupPath = path.join(this.backupDir, backupId);
            let backupFile = path.join(backupPath, 'backup.tar.gz');
            
            // Decrypt if necessary
            if (backup.encrypted) {
                const encryptedFile = path.join(backupPath, 'backup.encrypted');
                await this.decryptBackup(encryptedFile, backupFile);
            }
            
            // Extract backup
            const extractPath = path.join(backupPath, 'extract');
            await fs.mkdir(extractPath, { recursive: true });
            
            const command = `tar -xzf "${backupFile}" -C "${extractPath}"`;
            await execAsync(command);
            
            // Restore to MongoDB
            const dbUri = targetDbUri || process.env.MONGODB_URI;
            const dbName = backup.database;
            const dumpPath = path.join(extractPath, 'dump', dbName);
            
            await this.performMongoRestore(dbUri, dumpPath);
            
            // Clean up extracted files
            await this.removeDirectory(extractPath);
            
            // If we decrypted, remove the decrypted file
            if (backup.encrypted) {
                await fs.unlink(backupFile);
            }
            
            logger.info(`Restore completed from backup: ${backupId}`);
            return { success: true, backupId };
        } catch (error) {
            logger.error(`Restore failed from backup: ${backupId}`, error);
            throw error;
        }
    }

    /**
     * Perform MongoDB restore
     */
    async performMongoRestore(uri, dumpPath) {
        try {
            const command = `mongorestore --uri="${uri}" --nsInclude="${path.basename(dumpPath)}.*" "${path.dirname(dumpPath)}"`;
            
            logger.info(`Executing MongoDB restore: ${command}`);
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('done')) {
                logger.warn('MongoDB restore warnings:', stderr);
            }
            
            logger.info('MongoDB restore completed successfully');
        } catch (error) {
            logger.error('MongoDB restore failed:', error);
            throw new Error(`Failed to restore MongoDB: ${error.message}`);
        }
    }

    /**
     * Get backup list
     */
    getBackupList() {
        return this.metadata.backups.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    /**
     * Get backup statistics
     */
    getBackupStats() {
        const backups = this.metadata.backups;
        const totalSize = backups.reduce((sum, b) => sum + (b.compressedSize || 0), 0);
        const successfulBackups = backups.filter(b => b.status === 'completed');
        const failedBackups = backups.filter(b => b.status === 'failed');
        
        return {
            totalBackups: backups.length,
            successfulBackups: successfulBackups.length,
            failedBackups: failedBackups.length,
            totalSize,
            lastBackup: this.metadata.lastBackup,
            averageBackupSize: backups.length > 0 ? totalSize / backups.length : 0,
        };
    }

    /**
     * Schedule automated backups
     */
    scheduleBackups() {
        // This would integrate with node-cron or similar
        // For now, just log that scheduling is available
        logger.info('Backup scheduling available. Configure cron jobs for automated backups.');
    }
}

// Export singleton instance
module.exports = new BackupService();
