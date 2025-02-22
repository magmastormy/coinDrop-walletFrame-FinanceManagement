const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Log controller methods for debugging
console.log('Controller methods:', Object.keys(controller));
console.log('sendMessage:', controller.sendMessage);
console.log('getFinancialAdvice:', controller.getFinancialAdvice);

// Send message to ZhipuAI
router.post('/send', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.sendMessage(req, res, next);
    });
});

// Get financial advice
router.get('/:userId/financial-advice', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.getFinancialAdvice(req, res, next);
    });
});

module.exports = router;