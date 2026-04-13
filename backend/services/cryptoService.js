const logger = require('../utils/logger');

const axios = require('axios');
const redisClient = require('../config/redis');

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
    }

    async getCryptoPrices(cryptoIds) {
        const cacheKey = `crypto:${cryptoIds.join(',')}`;
        
        try {
            // Try to get from cache first
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return cached;
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
            await redisClient.set(cacheKey, response.data, this.cacheTTL);

            return response.data;
        } catch (error) {
            logger.error('CoinGecko API error:', error.message);
            
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
        const cacheKey = `crypto:${cryptoIds.join(',')}`;
        await redisClient.del(cacheKey);
    }

    async getLastUpdated() {
        const timestamp = await redisClient.get('crypto:last_updated');
        return timestamp ? new Date(parseInt(timestamp)) : null;
    }

    async updateLastUpdated() {
        await redisClient.set('crypto:last_updated', Date.now().toString(), 3600);
    }
}

module.exports = new CryptoService();
