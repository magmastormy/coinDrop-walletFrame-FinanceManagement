const redisClient = require('../config/redis');
const logger = require('./logger');
const metricsCollector = require('./metricsCollector');
const { circuitBreakers } = require('./circuitBreaker');

class CacheUtil {
    constructor() {
        this.defaultExpiration = 3600; // 1 hour default
    }

    /**
     * Generate a cache key based on the provided parameters
     */
    generateKey(prefix, ...args) {
        const keyParts = [prefix, ...args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg);
            }
            return arg.toString();
        })];
        return keyParts.join(':');
    }

    /**
     * Cache data with optional expiration
     */
    async set(key, data, expiration = this.defaultExpiration) {
        const startedAt = Date.now();
        try {
            const success = await circuitBreakers.redis.execute(
                () => redisClient.set(key, data, expiration),
                () => false // Fallback to false if Redis fails
            );
            const duration = Date.now() - startedAt;
            metricsCollector.recordHistogram('cache_operation_duration_seconds', duration / 1000, {
                operation: 'set',
                success: success.toString()
            });
            
            if (process.env.NODE_ENV === 'development') {
                logger.debug(`Cache set: ${key} (${expiration}s)`);
            }
            return success;
        } catch (error) {
            const duration = Date.now() - startedAt;
            metricsCollector.recordHistogram('cache_operation_duration_seconds', duration / 1000, {
                operation: 'set',
                success: 'false'
            });
            logger.error('❌ Cache set error:', error);
            return false;
        }
    }

    /**
     * Get cached data
     */
    async get(key) {
        const startedAt = Date.now();
        try {
            const data = await circuitBreakers.redis.execute(
                () => redisClient.get(key),
                () => null // Fallback to null if Redis fails
            );
            const duration = Date.now() - startedAt;
            const hit = data !== null;
            
            metricsCollector.recordHistogram('cache_operation_duration_seconds', duration / 1000, {
                operation: 'get',
                success: 'true'
            });
            
            metricsCollector.incrementCounter('cache_operations_total', 1, {
                operation: 'get',
                hit: hit.toString()
            });
            
            if (process.env.NODE_ENV === 'development') {
                logger.debug(`Cache ${hit ? 'hit' : 'miss'}: ${key}`);
            }
            return data;
        } catch (error) {
            const duration = Date.now() - startedAt;
            metricsCollector.recordHistogram('cache_operation_duration_seconds', duration / 1000, {
                operation: 'get',
                success: 'false'
            });
            logger.error('❌ Cache get error:', error);
            return null;
        }
    }

    /**
     * Delete cached data
     */
    async del(key) {
        try {
            const success = await circuitBreakers.redis.execute(
                () => redisClient.del(key),
                () => false // Fallback to false if Redis fails
            );
            if (process.env.NODE_ENV === 'development') {
                logger.debug(`Cache deleted: ${key}`);
            }
            return success;
        } catch (error) {
            logger.error('❌ Cache delete error:', error);
            return false;
        }
    }

    /**
     * Clear cache by pattern
     */
    async clearByPattern(pattern) {
        try {
            const success = await circuitBreakers.redis.execute(
                async () => {
                    const client = redisClient.getClient();
                    if (!client) {
                        return false;
                    }
                    
                    const keys = await client.keys(pattern);
                    if (keys.length > 0) {
                        await client.del(keys);
                        if (process.env.NODE_ENV === 'development') {
                            logger.debug(`Cache cleared by pattern: ${pattern} (${keys.length} keys)`);
                        }
                    }
                    return true;
                },
                () => false // Fallback to false if Redis fails
            );
            return success;
        } catch (error) {
            logger.error('❌ Cache clear by pattern error:', error);
            return false;
        }
    }

    /**
     * Cache wrapper for database queries
     */
    async cachedQuery(key, expiration, queryFunction) {
        // Try to get from cache first
        const cachedData = await this.get(key);
        if (cachedData) {
            return cachedData;
        }
        
        // If not in cache, execute the query
        const data = await queryFunction();
        
        // Cache the result
        if (data) {
            await this.set(key, data, expiration);
        }
        
        return data;
    }

    /**
     * Cache wrapper for API responses
     */
    async cachedApiResponse(req, res, expiration, handler) {
        const cacheKey = this.generateKey('api', req.method, req.path, JSON.stringify(req.query), JSON.stringify(req.body));
        
        // Try to get from cache
        const cachedData = await this.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
            // Cache the response
            cacheUtil.set(cacheKey, data, expiration).catch(err => {
                logger.error('❌ Error caching API response:', err);
            });
            return originalJson.call(this, data);
        };
        
        // Execute the handler
        await handler(req, res);
    }

    /**
     * Set cache expiration
     */
    async expire(key, seconds) {
        try {
            const success = await redisClient.expire(key, seconds);
            return success;
        } catch (error) {
            logger.error('❌ Cache expire error:', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    async exists(key) {
        try {
            const exists = await redisClient.exists(key);
            return exists;
        } catch (error) {
            logger.error('❌ Cache exists error:', error);
            return false;
        }
    }
}

// Export singleton instance
const cacheUtil = new CacheUtil();
module.exports = cacheUtil;
