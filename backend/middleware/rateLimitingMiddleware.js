const rateLimit = require('express-rate-limit');

// Rate limiting for transaction endpoints
const transactionRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many transaction requests from this IP, please try again later.',
        status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for non-transaction endpoints
        return !req.path.includes('/transactions');
    },
    keyGenerator: (req) => {
        // Use a combination of IP and user ID for more granular rate limiting
        return `${req.ip}-${req.user?.userId || req.user?._id || 'anonymous'}`;
    }
});

// Anti-fraud middleware for suspicious transaction patterns
const antiFraudMiddleware = (req, res, next) => {
    // Simple anti-fraud logic for demonstration
    // In a real-world scenario, this would be more sophisticated
    const { amount } = req.body;
    
    if (amount && parseFloat(amount) > 10000) {
        // Log suspicious transaction
        console.warn(`Suspicious transaction detected: $${amount} from user ${req.user?.userId || req.user?._id}`);
        
        // Add a flag to the request for further processing
        req.suspiciousTransaction = true;
    }
    
    next();
};

module.exports = {
    transactionRateLimit,
    antiFraudMiddleware
};