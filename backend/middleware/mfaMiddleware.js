const speakeasy = require('speakeasy');
const User = require('../models/User');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../utils/errorClasses');

/**
 * MFA Verification Middleware
 * 
 * Enforces Multi-Factor Authentication for sensitive operations.
 * Supports TOTP (Time-based One-Time Password) and HOTP.
 * Includes account locking after failed attempts.
 */

// In-memory store for MFA attempts (use Redis in production)
const mfaAttempts = new Map();
const MFA_ATTEMPT_LIMIT = 3;
const MFA_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Verify TOTP token
 * @param {string} token - TOTP token from user
 * @param {string} secret - Base32 encoded secret
 * @returns {boolean} Whether token is valid
 */
const verifyTOTP = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps (±30 seconds)
  });
};

/**
 * Check if user is locked out from MFA
 * @param {string} userId - User ID
 * @returns {Object} Lockout status
 */
const checkLockout = (userId) => {
  const attempts = mfaAttempts.get(userId);
  
  if (!attempts) {
    return { locked: false };
  }
  
  const { count, lastAttempt, lockedUntil } = attempts;
  
  // Check if lockout period has expired
  if (lockedUntil && Date.now() > lockedUntil) {
    mfaAttempts.delete(userId);
    return { locked: false };
  }
  
  // Check if currently locked
  if (lockedUntil && Date.now() < lockedUntil) {
    const remainingTime = Math.ceil((lockedUntil - Date.now()) / 1000 / 60);
    return { 
      locked: true, 
      remainingMinutes: remainingTime,
      message: `Account locked due to failed MFA attempts. Try again in ${remainingTime} minutes.`
    };
  }
  
  // Reset attempts if last attempt was long ago (30 minutes)
  if (Date.now() - lastAttempt > 30 * 60 * 1000) {
    mfaAttempts.delete(userId);
    return { locked: false };
  }
  
  return { locked: false, attemptCount: count };
};

/**
 * Record failed MFA attempt
 * @param {string} userId - User ID
 */
const recordFailedAttempt = (userId) => {
  const attempts = mfaAttempts.get(userId) || { count: 0, lastAttempt: Date.now() };
  
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  
  // Lock account if limit reached
  if (attempts.count >= MFA_ATTEMPT_LIMIT) {
    attempts.lockedUntil = Date.now() + MFA_LOCKOUT_DURATION;
    logger.warn('User locked out due to MFA failures', { 
      userId, 
      attempts: attempts.count,
      lockedUntil: attempts.lockedUntil 
    });
  }
  
  mfaAttempts.set(userId, attempts);
  return attempts.count;
};

/**
 * Clear MFA attempts (on successful verification)
 * @param {string} userId - User ID
 */
const clearAttempts = (userId) => {
  mfaAttempts.delete(userId);
};

/**
 * MFA Verification Middleware
 * Validates TOTP token for sensitive operations
 */
const mfaVerificationMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.authUserId;
    
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for lockout
    const lockoutStatus = checkLockout(userId);
    if (lockoutStatus.locked) {
      throw new ForbiddenError(lockoutStatus.message);
    }
    
    // Get MFA token from request
    const mfaToken = req.headers['x-mfa-token'] || req.body.mfaToken;
    
    if (!mfaToken) {
      throw new UnauthorizedError('MFA token required', {
        code: 'MFA_REQUIRED',
        message: 'This operation requires MFA verification. Please provide your TOTP token.'
      });
    }
    
    // Get user with MFA settings
    const user = await User.findById(userId).select('+mfaSecret +mfaEnabled');
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    // Check if MFA is enabled for user
    if (!user.mfaEnabled || !user.mfaSecret) {
      logger.warn('MFA verification attempted but not enabled', { userId });
      throw new ForbiddenError('MFA not enabled for this user');
    }
    
    // Verify TOTP token
    const isValid = verifyTOTP(mfaToken, user.mfaSecret);
    
    if (!isValid) {
      const attemptCount = recordFailedAttempt(userId);
      const remainingAttempts = MFA_ATTEMPT_LIMIT - attemptCount;
      
      logger.warn('Invalid MFA token', { 
        userId, 
        attemptCount,
        ip: req.ip 
      });
      
      if (remainingAttempts <= 0) {
        throw new ForbiddenError('Account locked due to failed MFA attempts. Please try again later.');
      }
      
      throw new UnauthorizedError(`Invalid MFA token. ${remainingAttempts} attempts remaining.`, {
        code: 'INVALID_MFA_TOKEN',
        remainingAttempts
      });
    }
    
    // Clear failed attempts on success
    clearAttempts(userId);
    
    // Log successful MFA verification
    logger.info('MFA verification successful', { 
      userId, 
      operation: req.path,
      ip: req.ip 
    });
    
    // Add MFA verification timestamp to request
    req.mfaVerified = true;
    req.mfaVerifiedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional MFA Middleware
 * Validates MFA if provided, but doesn't require it
 */
const optionalMFAMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.authUserId;
    const mfaToken = req.headers['x-mfa-token'] || req.body.mfaToken;
    
    if (!userId || !mfaToken) {
      // MFA not provided, continue without verification
      req.mfaVerified = false;
      return next();
    }
    
    // Verify MFA if provided
    const user = await User.findById(userId).select('+mfaSecret +mfaEnabled');
    
    if (user && user.mfaEnabled && user.mfaSecret) {
      const isValid = verifyTOTP(mfaToken, user.mfaSecret);
      
      if (isValid) {
        req.mfaVerified = true;
        req.mfaVerifiedAt = new Date();
        logger.info('Optional MFA verification successful', { userId });
      } else {
        req.mfaVerified = false;
        logger.warn('Optional MFA verification failed', { userId });
      }
    }
    
    next();
  } catch (error) {
    // Don't block request on optional MFA failure
    req.mfaVerified = false;
    next();
  }
};

/**
 * Generate MFA Secret for user setup
 * @param {string} userId - User ID
 * @returns {Object} Secret and QR code URL
 */
const generateMFASecret = (userId) => {
  const secret = speakeasy.generateSecret({
    name: `CoinDrip:${userId}`,
    length: 32
  });
  
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url)}`
  };
};

/**
 * Verify MFA setup token
 * @param {string} token - TOTP token
 * @param {string} secret - Base32 secret
 * @returns {boolean} Whether token is valid
 */
const verifyMFASetup = (token, secret) => {
  return verifyTOTP(token, secret);
};

/**
 * Get MFA status for user
 * @param {string} userId - User ID
 * @returns {Object} MFA status
 */
const getMFAStatus = async (userId) => {
  const user = await User.findById(userId).select('mfaEnabled');
  const lockoutStatus = checkLockout(userId);
  
  return {
    enabled: user?.mfaEnabled || false,
    locked: lockoutStatus.locked,
    remainingMinutes: lockoutStatus.remainingMinutes || 0
  };
};

module.exports = {
  mfaVerificationMiddleware,
  optionalMFAMiddleware,
  generateMFASecret,
  verifyMFASetup,
  getMFAStatus,
  verifyTOTP
};
