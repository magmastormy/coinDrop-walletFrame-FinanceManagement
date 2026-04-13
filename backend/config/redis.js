const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.MAX_ATTEMPTS = 5;
    }

    async connect() {
        try {
            const redisHost = process.env.REDIS_HOST || 'localhost';
            const redisPort = process.env.REDIS_PORT || 6379;
            const redisPassword = process.env.REDIS_PASSWORD || '';

            logger.info(`🔄 Attempting Redis connection to ${redisHost}:${redisPort}`);

            this.client = redis.createClient({
                socket: {
                    host: redisHost,
                    port: parseInt(redisPort),
                },
                ...(redisPassword && { password: redisPassword }),
                retryStrategy: (options) => {
                    // Exponential backoff with max delay and max attempts
                    const MAX_ATTEMPTS = 5;
                    const times = options.attempt;
                    if (times > MAX_ATTEMPTS) {
                        logger.warn(`❌ Redis connection failed after ${MAX_ATTEMPTS} attempts. Disabling Redis.`);
                        return null; // Stop reconnecting
                    }
                    const delay = Math.min(1000 * Math.pow(2, times), 30000);
                    logger.debug(`⏳ Redis reconnect attempt ${times}/${MAX_ATTEMPTS}, delay: ${delay}ms`);
                    return delay;
                },
            });

            // Event listeners
            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('🟢 Redis Connection Established 🔗');
            });

            // Track last error timestamp to avoid log spam
            let lastErrorTimestamp = 0;
            const ERROR_LOG_THROTTLE = 5000; // 5 seconds

            this.client.on('error', (error) => {
            this.isConnected = false;
            const now = Date.now();
            // Throttle error logs to avoid spam
            if (now - lastErrorTimestamp > ERROR_LOG_THROTTLE) {
                lastErrorTimestamp = now;
                console.log('Redis error event:', error);
                console.log('Logger service name:', logger.defaultMeta.service);
                logger.warn('⚠️ Redis Connection Error:', { error: error.message, code: error.code });
            }
        });

            this.client.on('end', () => {
                this.isConnected = false;
                logger.info('🔚 Redis Connection Ended');
            });

            this.client.on('reconnecting', () => {
                // Only log reconnect attempts at debug level to reduce noise
                logger.debug('🔄 Redis Reconnecting...');
            });

            this.client.on('ready', () => {
                this.isConnected = true;
                logger.info('✅ Redis Client Ready');
            });

            await this.client.connect();
            logger.info('✅ Redis Connection Successful');
            return this.client;
        } catch (error) {
            logger.error('❌ Redis Connection Failed:', error);
            // Redis connection failure shouldn't crash the application
            // We'll handle it gracefully and fall back to database
            this.isConnected = false;
            return null;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.disconnect();
                logger.info('✅ Redis Disconnected');
            } catch (error) {
                logger.error('❌ Error disconnecting from Redis:', error);
            }
        }
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.isConnected && this.client && this.client.isReady;
    }

    // Helper methods for common operations
    async get(key) {
        if (!this.isReady()) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('❌ Redis GET error:', error);
            return null;
        }
    }

    async set(key, value, expiration = 3600) {
        if (!this.isReady()) {
            return false;
        }
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: expiration,
            });
            return true;
        } catch (error) {
            logger.error('❌ Redis SET error:', error);
            return false;
        }
    }

    async del(key) {
        if (!this.isReady()) {
            return false;
        }
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('❌ Redis DEL error:', error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isReady()) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result > 0;
        } catch (error) {
            logger.error('❌ Redis EXISTS error:', error);
            return false;
        }
    }

    async incr(key) {
        if (!this.isReady()) {
            return null;
        }
        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error('❌ Redis INCR error:', error);
            return null;
        }
    }

    async expire(key, seconds) {
        if (!this.isReady()) {
            return false;
        }
        try {
            await this.client.expire(key, seconds);
            return true;
        } catch (error) {
            logger.error('❌ Redis EXPIRE error:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new RedisClient();
