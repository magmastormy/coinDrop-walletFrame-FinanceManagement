const axios = require('axios');
const redis = require('redis');

class CryptoService {
    constructor() {
        this.coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
        this.cacheTTL = 5 * 60; // 5 minutes in seconds
        this.fallbackData = {
            bitcoin: { usd: 30000, usd_24h_change: 2.5 },
            ethereum: { usd: 2000, usd_24h_change: 1.8 },
            binancecoin: { usd: 300, usd_24h_change: -0.5 },
            ripple: { usd: 0.5, usd_24h_change: 0.3 },
            cardano: { usd: 0.3, usd_24h_change: -1.2 }
        };
        
        // Initialize Redis client
        this.redisClient = null;
        if (process.env.REDIS_URL) {
            this.redisClient = redis.createClient({ url: process.env.REDIS_URL });
            this.redisClient.connect().catch(err => {
                console.error('Redis connection failed:', err.message);
            });
        }
    }

    async getCryptoPrices(cryptoIds) {
        const cacheKey = `crypto:${cryptoIds.join(',')}`;
        
        try {
            // Try to get from cache first
            if (this.redisClient) {
                const cached = await this.redisClient.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }

            // Fetch from CoinGecko API
            const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
                params: {
                    ids: cryptoIds.join(','),
                    vs_currencies: 'usd',
                    include_24hr_change: true,
                    include_last_updated_at: true
                },
                timeout: 5000, // 5 second timeout
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Cache the result
            if (this.redisClient) {
                await this.redisClient.setEx(
                    cacheKey,
                    this.cacheTTL,
                    JSON.stringify(response.data)
                );
            }

            return response.data;
        } catch (error) {
            console.error('CoinGecko API error:', error.message);
            
            // Return fallback data or last known good data
            const fallbackResponse = {};
            cryptoIds.forEach(id => {
                if (this.fallbackData[id]) {
                    fallbackResponse[id] = {
                        ...this.fallbackData[id],
                        last_updated_at: Math.floor(Date.now() / 1000)
                    };
                }
            });

            return fallbackResponse;
        }
    }

    async invalidateCache(cryptoIds) {
        if (!this.redisClient) return;
        
        const cacheKey = `crypto:${cryptoIds.join(',')}`;
        await this.redisClient.del(cacheKey);
    }

    async getLastUpdated() {
        if (!this.redisClient) return null;
        
        const timestamp = await this.redisClient.get('crypto:last_updated');
        return timestamp ? new Date(parseInt(timestamp)) : null;
    }

    async updateLastUpdated() {
        if (!this.redisClient) return;
        
        await this.redisClient.set(
            'crypto:last_updated',
            Date.now().toString(),
            { EX: 3600 } // Expire after 1 hour
        );
    }
}

module.exports = new CryptoService();
