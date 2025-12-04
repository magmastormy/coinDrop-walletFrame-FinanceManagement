/**
 * AI Response Cache
 * LRU cache with TTL for AI service responses
 * Provides per-user namespaces to prevent data leakage
 */

class AIResponseCache {
    constructor() {
        // Per-user cache storage: { userId: { key: { data, timestamp } } }
        this.cache = new Map();

        // TTL configurations (in milliseconds)
        this.ttls = {
            contextSuggestions: 5 * 60 * 1000,      // 5 minutes
            proactiveInsights: 10 * 60 * 1000,      // 10 minutes
            accountInfo: 2 * 60 * 1000,              // 2 minutes
            userContext: 3 * 60 * 1000               // 3 minutes
        };

        // Max cache entries per user
        this.maxEntriesPerUser = 50;

        // Cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Get cache key
     * @private
     */
    _getCacheKey(userId, type, params = '') {
        return `${userId}:${type}:${params}`;
    }

    /**
     * Get cached data for a user
     * @param {string} userId - User ID
     * @param {string} type - Cache type (contextSuggestions, proactiveInsights, etc.)
     * @param {string} params - Optional additional parameters
     * @returns {*} Cached data or null
     */
    get(userId, type, params = '') {
        if (!userId || !type) return null;

        const userCache = this.cache.get(userId);
        if (!userCache) return null;

        const key = this._getCacheKey(userId, type, params);
        const entry = userCache.get(key);

        if (!entry) return null;

        // Check if expired
        const ttl = this.ttls[type] || 5 * 60 * 1000;
        if (Date.now() - entry.timestamp > ttl) {
            userCache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cached data for a user
     * @param {string} userId - User ID
     * @param {string} type - Cache type
     * @param {*} data - Data to cache
     * @param {string} params - Optional additional parameters
     */
    set(userId, type, data, params = '') {
        if (!userId || !type) return;

        // Get or create user cache
        if (!this.cache.has(userId)) {
            this.cache.set(userId, new Map());
        }

        const userCache = this.cache.get(userId);
        const key = this._getCacheKey(userId, type, params);

        // Enforce max entries (LRU eviction)
        if (userCache.size >= this.maxEntriesPerUser) {
            const firstKey = userCache.keys().next().value;
            userCache.delete(firstKey);
        }

        userCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidate cache for a specific type
     * @param {string} userId - User ID
     * @param {string} type - Cache type to invalidate
     */
    invalidate(userId, type) {
        if (!userId) return;

        const userCache = this.cache.get(userId);
        if (!userCache) return;

        // Remove all entries of this type
        for (const [key, _] of userCache.entries()) {
            if (key.includes(`:${type}:`)) {
                userCache.delete(key);
            }
        }
    }

    /**
     * Invalidate all cache for a user
     * @param {string} userId - User ID
     */
    invalidateUser(userId) {
        if (!userId) return;
        this.cache.delete(userId);
    }

    /**
     * Invalidate all cache
     */
    invalidateAll() {
        this.cache.clear();
    }

    /**
     * Clean up expired entries
     * @private
     */
    cleanup() {
        const now = Date.now();

        for (const [userId, userCache] of this.cache.entries()) {
            for (const [key, entry] of userCache.entries()) {
                const type = key.split(':')[1];
                const ttl = this.ttls[type] || 5 * 60 * 1000;

                if (now - entry.timestamp > ttl) {
                    userCache.delete(key);
                }
            }

            // Remove empty user caches
            if (userCache.size === 0) {
                this.cache.delete(userId);
            }
        }
    }

    /**
     * Get cache stats
     * @returns {Object} Cache statistics
     */
    getStats() {
        let totalEntries = 0;
        const userCounts = {};

        for (const [userId, userCache] of this.cache.entries()) {
            userCounts[userId] = userCache.size;
            totalEntries += userCache.size;
        }

        return {
            totalUsers: this.cache.size,
            totalEntries,
            userCounts
        };
    }

    /**
     * Destroy cache and cleanup
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}

// Create singleton instance
const aiResponseCache = new AIResponseCache();

export default aiResponseCache;
