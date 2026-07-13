const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.isEnabled = !!process.env.REDIS_HOST;
    }

    async connect() {
        if (!this.isEnabled) {
            logger.info('Redis not configured (REDIS_HOST not set), skipping connection');
            return null;
        }

        try {
            const redisHost = process.env.REDIS_HOST;
            const redisPort = process.env.REDIS_PORT || 6379;
            const redisPassword = process.env.REDIS_PASSWORD || '';

            this.client = redis.createClient({
                socket: {
                    host: redisHost,
                    port: parseInt(redisPort),
                },
                ...(redisPassword && { password: redisPassword }),
                retryStrategy: (options) => {
                    const MAX_ATTEMPTS = 5;
                    if (options.attempt > MAX_ATTEMPTS) {
                        logger.warn(`Redis connection failed after ${MAX_ATTEMPTS} attempts. Disabling Redis.`);
                        return null;
                    }
                    const delay = Math.min(1000 * Math.pow(2, options.attempt), 30000);
                    return delay;
                },
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('Redis connection established');
            });

            let lastErrorTimestamp = 0;
            const ERROR_LOG_THROTTLE = 30000;

            this.client.on('error', (error) => {
                this.isConnected = false;
                const now = Date.now();
                if (now - lastErrorTimestamp > ERROR_LOG_THROTTLE) {
                    lastErrorTimestamp = now;
                    logger.warn('Redis connection error:', { code: error.code });
                }
            });

            this.client.on('end', () => {
                this.isConnected = false;
            });

            this.client.on('ready', () => {
                this.isConnected = true;
                logger.info('Redis client ready');
            });

            await this.client.connect();
            logger.info('Redis connection successful');
            return this.client;
        } catch (error) {
            logger.warn('Redis connection failed:', error.message);
            this.isConnected = false;
            return null;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.disconnect();
            } catch (error) {
                logger.warn('Error disconnecting from Redis:', error.message);
            }
        }
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.isEnabled && this.isConnected && this.client && this.client.isReady;
    }

    async get(key) {
        if (!this.isReady()) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.warn('Redis GET error:', error.message);
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
            logger.warn('Redis SET error:', error.message);
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
            logger.warn('Redis DEL error:', error.message);
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
            logger.warn('Redis EXISTS error:', error.message);
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
            logger.warn('Redis INCR error:', error.message);
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
            logger.warn('Redis EXPIRE error:', error.message);
            return false;
        }
    }
}

module.exports = new RedisClient();