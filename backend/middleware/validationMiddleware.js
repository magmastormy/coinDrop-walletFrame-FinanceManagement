const { validationResult } = require('express-validator');
const { sanitizeInput } = require('../utils/sanitizeHtml');

// Middleware to sanitize input before validation
const sanitizationMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
};

// Middleware to handle validation errors
const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};

module.exports = { 
    validationMiddleware,
    sanitizationMiddleware 
};
