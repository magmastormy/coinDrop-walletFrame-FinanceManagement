import zhipuaiModelService from './zhipuaiModelService';
import aiResponseCache from '../utils/aiResponseCache';

const isDev = import.meta.env.DEV;

/**
 * Circuit Breaker wrapper for AI service
 * Now with per-user isolation and response caching
 */

const FAILURE_THRESHOLD = 3;
const SUCCESS_THRESHOLD = 2;
const TIMEOUT = 60000; // 60 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds for chat requests

const CircuitState = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

class AIServiceCircuitBreaker {
    constructor() {
        // Per-user circuit breaker state
        this.userStates = new Map();
    }

    /**
     * Get or create user circuit state
     * @private
     */
    _getUserState(userId) {
        if (!this.userStates.has(userId)) {
            this.userStates.set(userId, {
                state: CircuitState.CLOSED,
                failureCount: 0,
                successCount: 0,
                nextAttempt: Date.now(),
                lastError: null
            });
        }
        return this.userStates.get(userId);
    }

    /**
     * Execute service call with circuit breaker protection
     * @param {string} userId - User ID for isolation
     * @param {Function} serviceCall - The actual service call
     * @param {number} timeout - Request timeout in ms
     */
    async execute(userId, serviceCall, timeout = REQUEST_TIMEOUT) {
        const userState = this._getUserState(userId);

        // Check if circuit is open
        if (userState.state === CircuitState.OPEN) {
            if (Date.now() < userState.nextAttempt) {
                return this.fallbackResponse(userState.lastError);
            }
            userState.state = CircuitState.HALF_OPEN;
        }

        try {
            // Add timeout to service call
            const result = await Promise.race([
                serviceCall(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), timeout)
                )
            ]);

            return this.onSuccess(userId, result);
        } catch (error) {
            return this.onFailure(userId, error);
        }
    }

    onSuccess(userId, result) {
        const userState = this._getUserState(userId);
        userState.failureCount = 0;

        if (userState.state === CircuitState.HALF_OPEN) {
            userState.successCount++;
            if (userState.successCount >= SUCCESS_THRESHOLD) {
                userState.state = CircuitState.CLOSED;
                userState.successCount = 0;
                if (isDev) console.log(`[Circuit Breaker] User ${userId}: Circuit CLOSED`);
            }
        }

        return result;
    }

    onFailure(userId, error) {
        const userState = this._getUserState(userId);
        userState.lastError = error;
        userState.failureCount++;
        userState.successCount = 0;

        if (userState.state === CircuitState.HALF_OPEN || userState.failureCount >= FAILURE_THRESHOLD) {
            userState.state = CircuitState.OPEN;
            userState.nextAttempt = Date.now() + TIMEOUT;
            if (isDev) console.log(`[Circuit Breaker] User ${userId}: Circuit OPEN`);
        }

        throw error;
    }

    fallbackResponse(error) {
        return {
            response: "I'm currently experiencing technical difficulties. Please try again in a moment.",
            isFallback: true,
            error: error?.message || 'Service temporarily unavailable'
        };
    }

    getState(userId) {
        const userState = this._getUserState(userId);
        return {
            state: userState.state,
            failureCount: userState.failureCount,
            nextAttempt: userState.nextAttempt,
            isAvailable: userState.state !== CircuitState.OPEN || Date.now() >= userState.nextAttempt
        };
    }

    reset(userId) {
        if (userId) {
            this.userStates.delete(userId);
        } else {
            this.userStates.clear();
        }
    }
}

const circuitBreaker = new AIServiceCircuitBreaker();

/**
 * AI Service Wrapper with caching and circuit breaker
 */
const aiServiceWrapper = {
    /**
     * Send message with caching disabled (real-time responses)
     */
    async sendMessage(messages, userId) {
        if (!userId) throw new Error('userId is required');

        return circuitBreaker.execute(
            userId,
            () => zhipuaiModelService.sendMessage(messages, userId),
            10000 // 10s timeout for chat
        );
    },

    /**
     * Get user context with caching
     */
    async getUserContext(userId) {
        if (!userId) throw new Error('userId is required');

        // Check cache first
        const cached = aiResponseCache.get(userId, 'userContext');
        if (cached) {
            if (isDev) console.log('[AI Service] Cache HIT: userContext');
            return cached;
        }

        if (isDev) console.log('[AI Service] Cache MISS: userContext');
        const result = await circuitBreaker.execute(
            userId,
            () => zhipuaiModelService.getUserContext(userId),
            30000 // 30s timeout
        );

        // Cache the result
        aiResponseCache.set(userId, 'userContext', result);
        return result;
    },

    /**
     * Get context suggestions with caching
     */
    async getContextSuggestions(userId) {
        if (!userId) throw new Error('userId is required');

        const cached = aiResponseCache.get(userId, 'contextSuggestions');
        if (cached) {
            if (isDev) console.log('[AI Service] Cache HIT: contextSuggestions');
            return cached;
        }

        if (isDev) console.log('[AI Service] Cache MISS: contextSuggestions');
        const result = await circuitBreaker.execute(
            userId,
            () => zhipuaiModelService.getContextSuggestions(userId),
            30000
        );

        aiResponseCache.set(userId, 'contextSuggestions', result);
        return result;
    },

    /**
     * Get account info with caching
     */
    async getUserAccountInfo(userId) {
        if (!userId) throw new Error('userId is required');

        const cached = aiResponseCache.get(userId, 'accountInfo');
        if (cached) {
            if (isDev) console.log('[AI Service] Cache HIT: accountInfo');
            return cached;
        }

        if (isDev) console.log('[AI Service] Cache MISS: accountInfo');
        const result = await circuitBreaker.execute(
            userId,
            () => zhipuaiModelService.getUserAccountInfo(userId),
            30000
        );

        aiResponseCache.set(userId, 'accountInfo', result);
        return result;
    },

    /**
     * Get proactive insights with caching
     */
    async getProactiveInsights(userId) {
        if (!userId) throw new Error('userId is required');

        const cached = aiResponseCache.get(userId, 'proactiveInsights');
        if (cached) {
            if (isDev) console.log('[AI Service] Cache HIT: proactiveInsights');
            return cached;
        }

        if (isDev) console.log('[AI Service] Cache MISS: proactiveInsights');
        const result = await circuitBreaker.execute(
            userId,
            () => zhipuaiModelService.getProactiveInsights(userId),
            30000
        );

        aiResponseCache.set(userId, 'proactiveInsights', result);
        return result;
    },

    /**
     * Invalidate cache for user (call after data changes)
     */
    invalidateCache(userId, type) {
        if (type) {
            aiResponseCache.invalidate(userId, type);
        } else {
            aiResponseCache.invalidateUser(userId);
        }
    },

    /**
     * Get circuit breaker state for monitoring
     */
    getCircuitState(userId) {
        return circuitBreaker.getState(userId);
    },

    /**
     * Reset circuit breaker
     */
    resetCircuit(userId) {
        circuitBreaker.reset(userId);
    },

    /**
     * Get cache stats for monitoring
     */
    getCacheStats() {
        return aiResponseCache.getStats();
    }
};

export default aiServiceWrapper;
