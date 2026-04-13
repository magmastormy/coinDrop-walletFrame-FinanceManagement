const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Credential Encryption Service
 * 
 * Provides AES-256-GCM encryption with envelope encryption pattern
 * for secure credential storage. Uses DEK/KEK key hierarchy.
 */

class CredentialEncryptionService {
  constructor() {
    // Algorithm configuration
    this.ALGORITHM = 'aes-256-gcm';
    this.KEY_LENGTH = 32; // 256 bits
    this.IV_LENGTH = 16; // 128 bits
    this.AUTH_TAG_LENGTH = 16; // 128 bits
    
    // KEK (Key Encryption Key) - In production, this should come from KMS/Vault
    // For now, we'll use an environment variable with fallback for development
    this.KEK = this._loadKEK();
    
    // Key rotation tracking
    this.keyVersion = process.env.ENCRYPTION_KEY_VERSION || '1';
    this.dekCache = new Map(); // Cache for decrypted DEKs (memory only)
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load KEK from secure storage
   * @private
   */
  _loadKEK() {
    const kekFromEnv = process.env.CREDENTIAL_ENCRYPTION_KEK;
    
    if (!kekFromEnv) {
      logger.warn('CREDENTIAL_ENCRYPTION_KEK not set, using development key');
      // Generate a deterministic key for development (DO NOT USE IN PRODUCTION)
      return crypto.scryptSync('development-key-do-not-use-in-production', 'salt', this.KEY_LENGTH);
    }
    
    // Decode base64 KEK
    return Buffer.from(kekFromEnv, 'base64');
  }

  /**
   * Generate a new Data Encryption Key (DEK)
   * @returns {Object} DEK data with encrypted key and metadata
   */
  generateDEK() {
    try {
      // Generate random DEK
      const dek = crypto.randomBytes(this.KEY_LENGTH);
      
      // Generate random IV for KEK encryption
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Encrypt DEK with KEK
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEK, iv);
      const encryptedDEK = Buffer.concat([
        cipher.update(dek),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      
      // DEK ID for tracking
      const dekId = crypto.randomUUID();
      
      logger.info('Generated new DEK', { dekId, keyVersion: this.keyVersion });
      
      return {
        dekId,
        encryptedDEK: Buffer.concat([iv, authTag, encryptedDEK]).toString('base64'),
        algorithm: this.ALGORITHM,
        keyVersion: this.keyVersion,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to generate DEK', { error: error.message });
      throw new Error('DEK generation failed');
    }
  }

  /**
   * Decrypt a DEK using KEK
   * @param {string} encryptedDEK - Base64 encoded encrypted DEK
   * @returns {Buffer} Decrypted DEK
   */
  decryptDEK(encryptedDEK) {
    try {
      // Check cache first
      const cached = this.dekCache.get(encryptedDEK);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.dek;
      }
      
      const data = Buffer.from(encryptedDEK, 'base64');
      
      // Extract components
      const iv = data.slice(0, this.IV_LENGTH);
      const authTag = data.slice(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      const encryptedKey = data.slice(this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      
      // Decrypt DEK
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEK, iv);
      decipher.setAuthTag(authTag);
      
      const dek = Buffer.concat([
        decipher.update(encryptedKey),
        decipher.final()
      ]);
      
      // Cache decrypted DEK
      this.dekCache.set(encryptedDEK, {
        dek,
        timestamp: Date.now()
      });
      
      // Schedule cache cleanup
      setTimeout(() => {
        this.dekCache.delete(encryptedDEK);
      }, this.CACHE_TTL);
      
      return dek;
    } catch (error) {
      logger.error('Failed to decrypt DEK', { error: error.message });
      throw new Error('DEK decryption failed');
    }
  }

  /**
   * Encrypt credentials using DEK
   * @param {Object} credentials - Credentials object to encrypt
   * @param {string} dekId - DEK identifier
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Object} Encrypted credentials with metadata
   */
  encryptCredentials(credentials, dekId, dek) {
    try {
      const plaintext = JSON.stringify(credentials);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, dek, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      
      logger.info('Encrypted credentials', { dekId });
      
      return {
        encryptedData: Buffer.concat([iv, authTag, encrypted]).toString('base64'),
        dekId,
        algorithm: this.ALGORITHM,
        encryptedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to encrypt credentials', { error: error.message, dekId });
      throw new Error('Credential encryption failed');
    }
  }

  /**
   * Decrypt credentials using DEK
   * @param {string} encryptedData - Base64 encoded encrypted credentials
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Object} Decrypted credentials
   */
  decryptCredentials(encryptedData, dek) {
    try {
      const data = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = data.slice(0, this.IV_LENGTH);
      const authTag = data.slice(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      const encrypted = data.slice(this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      
      // Decrypt
      const decipher = crypto.createDecipheriv(this.ALGORITHM, dek, iv);
      decipher.setAuthTag(authTag);
      
      const plaintext = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]).toString('utf8');
      
      return JSON.parse(plaintext);
    } catch (error) {
      logger.error('Failed to decrypt credentials', { error: error.message });
      throw new Error('Credential decryption failed');
    }
  }

  /**
   * Full encryption flow: Generate DEK and encrypt credentials
   * @param {Object} credentials - Credentials to encrypt
   * @returns {Object} Encryption result with metadata
   */
  encrypt(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Invalid credentials provided');
    }
    
    // Generate new DEK
    const dekData = this.generateDEK();
    const dek = this.decryptDEK(dekData.encryptedDEK);
    
    // Encrypt credentials
    const encryptedCredentials = this.encryptCredentials(
      credentials,
      dekData.dekId,
      dek
    );
    
    return {
      encryptedCredentials: encryptedCredentials.encryptedData,
      encryptionMetadata: {
        dekId: dekData.dekId,
        encryptedDEK: dekData.encryptedDEK,
        algorithm: dekData.algorithm,
        keyVersion: dekData.keyVersion,
        encryptedAt: encryptedCredentials.encryptedAt
      }
    };
  }

  /**
   * Full decryption flow: Decrypt DEK and credentials
   * @param {string} encryptedCredentials - Encrypted credentials
   * @param {Object} encryptionMetadata - Encryption metadata
   * @returns {Object} Decrypted credentials
   */
  decrypt(encryptedCredentials, encryptionMetadata) {
    if (!encryptedCredentials || !encryptionMetadata) {
      throw new Error('Invalid encryption data provided');
    }
    
    // Decrypt DEK
    const dek = this.decryptDEK(encryptionMetadata.encryptedDEK);
    
    // Decrypt credentials
    return this.decryptCredentials(encryptedCredentials, dek);
  }

  /**
   * Rotate encryption key for credentials
   * @param {string} encryptedCredentials - Current encrypted credentials
   * @param {Object} encryptionMetadata - Current encryption metadata
   * @returns {Object} New encryption with rotated key
   */
  rotateKey(encryptedCredentials, encryptionMetadata) {
    try {
      // Decrypt with old key
      const decrypted = this.decrypt(encryptedCredentials, encryptionMetadata);
      
      // Re-encrypt with new key
      const newEncryption = this.encrypt(decrypted);
      
      logger.info('Key rotation completed', {
        oldDekId: encryptionMetadata.dekId,
        newDekId: newEncryption.encryptionMetadata.dekId
      });
      
      return newEncryption;
    } catch (error) {
      logger.error('Key rotation failed', { error: error.message });
      throw new Error('Key rotation failed');
    }
  }

  /**
   * Securely clear sensitive data from memory
   * @param {Buffer} buffer - Buffer to clear
   */
  secureClear(buffer) {
    if (Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      algorithm: this.ALGORITHM,
      keyVersion: this.keyVersion,
      kekLoaded: !!this.KEK,
      cacheSize: this.dekCache.size,
      timestamp: new Date()
    };
  }
}

// Export singleton instance
module.exports = new CredentialEncryptionService();
