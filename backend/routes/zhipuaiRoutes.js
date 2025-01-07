const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

console.log('Controller methods:', Object.keys(controller));
console.log('sendMessage:', controller.sendMessage);
console.log('getHistory:', controller.getHistory);

// Send message to ZhipuAI
router.post('/send', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.sendMessage(req, res, next);
    });
});

// Get chat history
router.get('/history', (req, res, next) => {
    authMiddleware(req, res, () => {
        controller.getHistory(req, res, next);
    });
});

module.exports = router;