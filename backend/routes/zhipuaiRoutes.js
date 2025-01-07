const express = require('express');
const router = express.Router();
const zhipuaiController = require('../controllers/zhipuaiController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Send message to ZhipuAI
router.post('/send', authenticateToken, zhipuaiController.sendMessage);

// Get chat history
router.get('/history', authenticateToken, zhipuaiController.getHistory);

module.exports = router;