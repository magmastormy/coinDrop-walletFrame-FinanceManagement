const logger = require('./logger');
const metricsCollector = require('./metricsCollector');

class CircuitBreaker {
    constructor(options = {}) {
        this.options = {
            failureThreshold: options.failureThreshold || 50, // Percentage
            resetTimeout: options.resetTimeout || 30000, // 30 seconds
            timeout: options.timeout || 10000, // 10 seconds
            windowSize: options.windowSize || 100, // Number of requests to consider
            ...options
        };

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.requestCount = 0;
        this.lastFailureTime = 0;
        this.resetTimer = null;
        this.name = options.name || 'default';
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn, fallback = null) {
        this.requestCount++;

        // Check if circuit is open
        if (this.state === 'OPEN') {
            // Check if we should try to half-open
            if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
                this.state = 'HALF_OPEN';
                logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
            } else {
                // Circuit is open, use fallback if available
                if (fallback) {
                    logger.warn(`Circuit breaker ${this.name} is OPEN, using fallback`);
                    metricsCollector.incrementCounter('circuit_breaker_open', 1, { name: this.name });
                    return fallback();
                }
                throw new Error(`Circuit breaker ${this.name} is OPEN`);
            }
        }

        try {
            // Execute the function with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Circuit breaker ${this.name} timeout`)), this.options.timeout);
            });

            const result = await Promise.race([fn(), timeoutPromise]);

            // If we were in HALF_OPEN and the request succeeded, close the circuit
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failureCount = 0;
                this.requestCount = 0;
                logger.info(`Circuit breaker ${this.name} transitioning to CLOSED`);
                metricsCollector.incrementCounter('circuit_breaker_closed', 1, { name: this.name });
            }

            metricsCollector.incrementCounter('circuit_breaker_success', 1, { name: this.name });
            return result;
        } catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            // Calculate failure percentage
            const failurePercentage = (this.failureCount / this.requestCount) * 100;

            // If failure percentage exceeds threshold, open the circuit
            if (this.state === 'CLOSED' && failurePercentage >= this.options.failureThreshold) {
                this.state = 'OPEN';
                logger.warn(`Circuit breaker ${this.name} transitioning to OPEN due to ${failurePercentage.toFixed(2)}% failures`);
                metricsCollector.incrementCounter('circuit_breaker_open', 1, { name: this.name });
            } else if (this.state === 'HALF_OPEN') {
                // If we were in HALF_OPEN and the request failed, open the circuit again
                this.state = 'OPEN';
                logger.warn(`Circuit breaker ${this.name} transitioning back to OPEN after failed HALF_OPEN attempt`);
                metricsCollector.incrementCounter('circuit_breaker_open', 1, { name: this.name });
            }

            // Use fallback if available
            if (fallback) {
                logger.warn(`Circuit breaker ${this.name} failure, using fallback: ${error.message}`);
                return fallback();
            }

            throw error;
        }
    }

    /**
     * Get circuit breaker state
     */
    getState() {
        return this.state;
    }

    /**
     * Get circuit breaker stats
     */
    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            requestCount: this.requestCount,
            failurePercentage: this.requestCount > 0 ? (this.failureCount / this.requestCount) * 100 : 0,
            lastFailureTime: this.lastFailureTime
        };
    }

    /**
     * Reset circuit breaker
     */
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.requestCount = 0;
        this.lastFailureTime = 0;
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
        logger.info(`Circuit breaker ${this.name} reset to CLOSED`);
    }
}

// Create circuit breakers for common services
const circuitBreakers = {
    aiService: new CircuitBreaker({
        name: 'ai_service',
        failureThreshold: 30,
        resetTimeout: 15000,
        timeout: 5000
    }),
    redis: new CircuitBreaker({
        name: 'redis',
        failureThreshold: 20,
        resetTimeout: 10000,
        timeout: 2000
    }),
    database: new CircuitBreaker({
        name: 'database',
        failureThreshold: 10,
        resetTimeout: 5000,
        timeout: 3000
    }),
    externalApi: new CircuitBreaker({
        name: 'external_api',
        failureThreshold: 40,
        resetTimeout: 20000,
        timeout: 8000
    })
};

module.exports = {
    CircuitBreaker,
    circuitBreakers
};