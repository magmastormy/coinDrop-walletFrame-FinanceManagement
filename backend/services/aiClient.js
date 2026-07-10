const logger = require('../utils/logger');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

const MODEL = 'meta/llama-3.3-70b-instruct';

// Circuit breaker
const circuitBreaker = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    failureThreshold: 3,
    resetTimeout: 30000,

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
            logger.debug(`[aiClient] Circuit breaker opened after ${this.failureCount} failures`);
            this.state = 'OPEN';
        }
    },

    recordSuccess() {
        if (this.state === 'HALF_OPEN') {
            logger.debug('[aiClient] Circuit breaker closed after successful request');
            this.state = 'CLOSED';
            this.failureCount = 0;
        }
    },

    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                logger.debug('[aiClient] Circuit breaker transitioning to HALF_OPEN state');
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }
};

/**
 * Sanitize text to remove invalid Unicode characters
 */
function sanitizeUnicode(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/[\uD800-\uDBFF][^\uDC00-\uDFFF]|[^\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF]$|^[\uDC00-\uDFFF]/g, '\uFFFD')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sends messages to the AI model via NVIDIA API and returns the response.
 * @param {Array} messages - Array of message objects { role, content }
 * @param {Object} [options] - Optional settings
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<string>} - AI response content
 */
async function send(messages, { timeoutMs = 30000 } = {}) {
    if (circuitBreaker.isOpen()) {
        logger.debug('[aiClient] Circuit breaker is open, fast-failing request');
        throw new Error('AI service is temporarily unavailable due to multiple failures. Please try again later.');
    }

    const sanitizedMessages = messages.map(msg => ({
        role: msg.role,
        content: sanitizeUnicode(msg.content || '')
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: sanitizedMessages,
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
            stream: false
        }, { signal: controller.signal });

        clearTimeout(timeout);

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('Empty response from AI service');
        }

        circuitBreaker.recordSuccess();
        return response;
    } catch (err) {
        clearTimeout(timeout);
        circuitBreaker.recordFailure();

        if (err.name === 'AbortError') {
            throw new Error(`AI service timeout after ${timeoutMs}ms`);
        }

        if (err.status === 401) {
            throw new Error('AI service authentication error');
        }

        throw new Error(`AI service error: ${err.message}`);
    }
}

module.exports = { send };
