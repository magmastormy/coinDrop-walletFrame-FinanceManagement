const express = require('express');
const router = express.Router();
const CryptoController = require('../controllers/cryptoController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public endpoint for crypto prices (with caching)
router.get('/prices', CryptoController.getCryptoPrices);

// Authenticated endpoint for refreshing prices
router.post('/refresh', authMiddleware, CryptoController.refreshCryptoPrices);

module.exports = router;
