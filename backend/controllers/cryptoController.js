const cryptoService = require('../services/cryptoService');

class CryptoController {
    static async getCryptoPrices(req, res) {
        try {
            const { ids = 'bitcoin,ethereum,binancecoin,ripple,cardano' } = req.query;
            const cryptoIds = ids.split(',').map(id => id.trim());
            
            const prices = await cryptoService.getCryptoPrices(cryptoIds);
            const lastUpdated = await cryptoService.getLastUpdated();
            
            // Update last updated timestamp
            await cryptoService.updateLastUpdated();
            
            res.json({
                data: prices,
                lastUpdated: lastUpdated || new Date(),
                source: 'cached' // Will be set by service if from cache
            });
        } catch (error) {
            res.status(500).json({
                error_code: 'CRYPTO_FETCH_FAILED',
                message: 'Failed to fetch cryptocurrency prices',
                details: error.message
            });
        }
    }

    static async refreshCryptoPrices(req, res) {
        try {
            const { ids = 'bitcoin,ethereum,binancecoin,ripple,cardano' } = req.query;
            const cryptoIds = ids.split(',').map(id => id.trim());
            
            // Invalidate cache
            await cryptoService.invalidateCache(cryptoIds);
            
            // Fetch fresh data
            const prices = await cryptoService.getCryptoPrices(cryptoIds);
            await cryptoService.updateLastUpdated();
            
            res.json({
                data: prices,
                lastUpdated: new Date(),
                source: 'fresh'
            });
        } catch (error) {
            res.status(500).json({
                error_code: 'CRYPTO_REFRESH_FAILED',
                message: 'Failed to refresh cryptocurrency prices',
                details: error.message
            });
        }
    }
}

module.exports = CryptoController;
