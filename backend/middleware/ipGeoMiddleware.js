const geoip = require('geoip-lite');
const logger = require('../utils/logger');
const { ForbiddenError } = require('../utils/errorClasses');

/**
 * IP Whitelisting and Geo-Restriction Middleware
 *
 * Enforces network-level access control for integration management.
 * Validates IP addresses against whitelist and checks geographic location.
 */

// In-memory cache for geo lookups (reduce external API calls)
const geoCache = new Map();
const GEO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIP = (req) => {
  // Check for forwarded IP (behind proxy)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // Fall back to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || null;
};

/**
 * Check if IP is in CIDR range
 * @param {string} ip - IP address to check
 * @param {string} cidr - CIDR notation (e.g., '192.168.1.0/24')
 * @returns {boolean} Whether IP is in range
 */
const isIPInCIDR = (ip, cidr) => {
  const [range, bits = 32] = cidr.split('/');
  const mask = parseInt(bits);

  const ipParts = ip.split('.').map(Number);
  const rangeParts = range.split('.').map(Number);

  const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

  const maskInt = -1 << (32 - mask);

  return (ipInt & maskInt) === (rangeInt & maskInt);
};

/**
 * Check if IP is private/internal
 * @param {string} ip - IP address
 * @returns {boolean} Whether IP is private
 */
const isPrivateIP = (ip) => {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16'
  ];

  return privateRanges.some(cidr => isIPInCIDR(ip, cidr));
};

/**
 * Detect if IP is from VPN/proxy
 * @param {string} ip - IP address
 * @returns {Promise<boolean>} Whether IP is VPN/proxy
 */
const isVPNOrProxy = async (ip) => {
  // Check cache first
  const cached = geoCache.get(`vpn:${ip}`);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.isVPN;
  }

  try {
    // Simple heuristics for VPN/proxy detection
    // In production, use a service like IPQS or MaxMind
    const geo = geoip.lookup(ip);

    // Flag if IP is from known hosting provider
    const hostingProviders = ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Linode'];
    const isHostingProvider = geo && hostingProviders.some(provider =>
      geo.org && geo.org.includes(provider)
    );

    // Check for common VPN ports or behaviors
    // This is a simplified check - production should use proper detection service
    const isVPN = isHostingProvider || false;

    // Cache result
    geoCache.set(`vpn:${ip}`, {
      isVPN,
      timestamp: Date.now()
    });

    return isVPN;
  } catch (error) {
    logger.error('VPN detection failed', { error: error.message, ip });
    return false;
  }
};

/**
 * Get geographic information for IP
 * @param {string} ip - IP address
 * @returns {Object} Geographic data
 */
const getGeoLocation = (ip) => {
  // Check cache
  const cached = geoCache.get(`geo:${ip}`);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.data;
  }

  try {
    const geo = geoip.lookup(ip);

    const data = {
      country: geo?.country || 'Unknown',
      region: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
      ll: geo?.ll || [0, 0], // latitude, longitude
      timezone: geo?.timezone || 'Unknown',
      isPrivate: isPrivateIP(ip)
    };

    // Cache result
    geoCache.set(`geo:${ip}`, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    logger.error('Geo lookup failed', { error: error.message, ip });
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      ll: [0, 0],
      timezone: 'Unknown',
      isPrivate: isPrivateIP(ip)
    };
  }
};

/**
 * IP Whitelist Middleware
 * Validates client IP against configured whitelist
 */
const ipWhitelistMiddleware = (options = {}) => {
  const {
    allowedIPs = [],
    allowPrivateIPs = true,
    blockVPNs = false,
    customMessage = 'Access denied from this IP address'
  } = options;

  return async (req, res, next) => {
    try {
      const clientIP = getClientIP(req);

      if (!clientIP) {
        logger.warn('Could not determine client IP');
        throw new ForbiddenError('Unable to verify IP address');
      }

      // Attach IP to request for later use
      req.clientIP = clientIP;
      req.geoLocation = getGeoLocation(clientIP);

      // Allow private IPs if configured
      if (allowPrivateIPs && isPrivateIP(clientIP)) {
        logger.debug('Allowing private IP', { ip: clientIP });
        return next();
      }

      // Check VPN/proxy if blocking enabled
      if (blockVPNs) {
        const isVPN = await isVPNOrProxy(clientIP);
        if (isVPN) {
          logger.warn('VPN/Proxy access blocked', { ip: clientIP });
          throw new ForbiddenError('Access from VPN/proxy is not allowed');
        }
      }

      // If no whitelist configured, allow all (except VPNs if blocked)
      if (!allowedIPs || allowedIPs.length === 0) {
        return next();
      }

      // Check IP against whitelist
      const isAllowed = allowedIPs.some(allowedIP => {
        if (allowedIP.includes('/')) {
          return isIPInCIDR(clientIP, allowedIP);
        }
        return clientIP === allowedIP;
      });

      if (!isAllowed) {
        logger.warn('IP not in whitelist', {
          ip: clientIP,
          allowedIPs: allowedIPs.length
        });
        throw new ForbiddenError(customMessage);
      }

      logger.debug('IP whitelist check passed', { ip: clientIP });
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Geo-Restriction Middleware
 * Validates client location against allowed regions
 */
const geoRestrictionMiddleware = (options = {}) => {
  const {
    allowedRegions = [],
    blockedRegions = [],
    customMessage = 'Access not allowed from your location'
  } = options;

  return (req, res, next) => {
    try {
      const clientIP = req.clientIP || getClientIP(req);

      if (!clientIP) {
        logger.warn('Could not determine client IP for geo check');
        throw new ForbiddenError('Unable to verify location');
      }

      // Get geo location
      const geo = req.geoLocation || getGeoLocation(clientIP);
      req.geoLocation = geo;

      // Check blocked regions first
      if (blockedRegions.length > 0) {
        const isBlocked = blockedRegions.some(region =>
          geo.country === region.toUpperCase()
        );

        if (isBlocked) {
          logger.warn('Access from blocked region', {
            ip: clientIP,
            country: geo.country
          });
          throw new ForbiddenError(customMessage);
        }
      }

      // Check allowed regions
      if (allowedRegions.length > 0) {
        const isAllowed = allowedRegions.some(region =>
          geo.country === region.toUpperCase()
        );

        if (!isAllowed) {
          logger.warn('Access from unauthorized region', {
            ip: clientIP,
            country: geo.country,
            allowedRegions
          });
          throw new ForbiddenError(customMessage);
        }
      }

      logger.debug('Geo-restriction check passed', {
        ip: clientIP,
        country: geo.country
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Combined IP and Geo Middleware
 * Validates both IP whitelist and geo-restriction
 */
const ipGeoMiddleware = (options = {}) => {
  const {
    allowedIPs = [],
    allowedRegions = [],
    blockedRegions = [],
    allowPrivateIPs = true,
    blockVPNs = false
  } = options;

  return async (req, res, next) => {
    try {
      const clientIP = getClientIP(req);

      if (!clientIP) {
        logger.warn('Could not determine client IP');
        throw new ForbiddenError('Unable to verify IP address');
      }

      // Attach IP and geo to request
      req.clientIP = clientIP;
      req.geoLocation = getGeoLocation(clientIP);

      // Allow private IPs if configured
      if (allowPrivateIPs && isPrivateIP(clientIP)) {
        return next();
      }

      // Check VPN/proxy
      if (blockVPNs) {
        const isVPN = await isVPNOrProxy(clientIP);
        if (isVPN) {
          logger.warn('VPN/Proxy access blocked', { ip: clientIP });
          throw new ForbiddenError('Access from VPN/proxy is not allowed');
        }
      }

      // Check IP whitelist
      if (allowedIPs.length > 0) {
        const isIPAllowed = allowedIPs.some(allowedIP => {
          if (allowedIP.includes('/')) {
            return isIPInCIDR(clientIP, allowedIP);
          }
          return clientIP === allowedIP;
        });

        if (!isIPAllowed) {
          logger.warn('IP not in whitelist', { ip: clientIP });
          throw new ForbiddenError('Access denied from this IP address');
        }
      }

      // Check blocked regions
      if (blockedRegions.length > 0) {
        const isBlocked = blockedRegions.some(region =>
          req.geoLocation.country === region.toUpperCase()
        );

        if (isBlocked) {
          logger.warn('Access from blocked region', {
            ip: clientIP,
            country: req.geoLocation.country
          });
          throw new ForbiddenError('Access not allowed from your location');
        }
      }

      // Check allowed regions
      if (allowedRegions.length > 0) {
        const isAllowed = allowedRegions.some(region =>
          req.geoLocation.country === region.toUpperCase()
        );

        if (!isAllowed) {
          logger.warn('Access from unauthorized region', {
            ip: clientIP,
            country: req.geoLocation.country
          });
          throw new ForbiddenError('Access not allowed from your location');
        }
      }

      logger.debug('IP and Geo checks passed', {
        ip: clientIP,
        country: req.geoLocation.country
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate Limiting by IP Middleware
 * Simple in-memory rate limiting (use Redis in production)
 */
const ipRateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests from this IP'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const clientIP = req.clientIP || getClientIP(req);

    if (!clientIP) {
      return next();
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request history for IP
    let ipRequests = requests.get(clientIP) || [];

    // Remove old requests outside window
    ipRequests = ipRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (ipRequests.length >= maxRequests) {
      logger.warn('IP rate limit exceeded', {
        ip: clientIP,
        requests: ipRequests.length
      });

      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    ipRequests.push(now);
    requests.set(clientIP, ipRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - ipRequests.length));
    res.setHeader('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());

    next();
  };
};

module.exports = {
  ipWhitelistMiddleware,
  geoRestrictionMiddleware,
  ipGeoMiddleware,
  ipRateLimitMiddleware,
  getClientIP,
  getGeoLocation,
  isPrivateIP,
  isVPNOrProxy,
  isIPInCIDR
};
