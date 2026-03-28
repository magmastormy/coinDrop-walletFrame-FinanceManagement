const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
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
                retryStrategy: (times) => {
                    // Exponential backoff with max delay
                    const delay = Math.min(1000 * Math.pow(2, times), 30000);
                    logger.info(`⏳ Redis reconnect attempt ${times}, delay: ${delay}ms`);
                    return delay;
                },
            });

            // Event listeners
            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('🟢 Redis Connection Established 🔗');
            });

            this.client.on('error', (error) => {
                this.isConnected = false;
                logger.error('⚠️ Redis Connection Error:', error);
            });

            this.client.on('end', () => {
                this.isConnected = false;
                logger.info('🔚 Redis Connection Ended');
            });

            this.client.on('reconnecting', () => {
                logger.info('🔄 Redis Reconnecting...');
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
