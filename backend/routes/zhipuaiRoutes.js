const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Test route
router.get('/test', (req, res) => {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
        console.log('ZhipuAI test route accessed');
    }
    res.json({ message: 'ZhipuAI route test successful' });
});

// Send message to ZhipuAI
router.post('/send', authMiddleware, controller.sendMessage);

// Account info - place this before /:userId routes to avoid conflicts
router.get('/account-info', authMiddleware, controller.getUserAccountInfo);

// Get financial advice
router.get('/:userId/financial-advice', authMiddleware, controller.getFinancialAdvice);

// Routes for proactive insights and context-aware suggestions
router.get('/:userId/proactive-insights', authMiddleware, controller.getProactiveInsights);
router.get('/:userId/context-suggestions', authMiddleware, controller.getContextSuggestions);

// Account info with userId parameter
router.get('/:userId/account-info', authMiddleware, controller.getUserAccountInfo);

module.exports = router;