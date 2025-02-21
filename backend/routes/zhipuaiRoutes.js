const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Log controller methods for debugging
console.log('Controller methods:', Object.keys(controller));
console.log('sendMessage:', controller.sendMessage);
console.log('getHistory:', controller.getHistory);
console.log('processVideo:', controller.processVideo);
console.log('getFinancialAdvice:', controller.getFinancialAdvice);

// Send message to ZhipuAI
router.post('/send', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.sendMessage(req, res, next);
    });
});

// Get financial advice
router.get('/financial-advice', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.getFinancialAdvice(req, res, next);
    });
});

// Get chat history
router.get('/history', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.getHistory(req, res, next);
    });
});

// Process video request
router.post('/process-video', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.processVideo(req, res, next);
    });
});

module.exports = router;