const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/send', authMiddleware, controller.sendMessage);

router.get('/user-context', authMiddleware, controller.getUserContext);
router.get('/context-suggestions', authMiddleware, controller.getContextSuggestions);
router.get('/user-account-info', authMiddleware, controller.getUserAccountInfo);
router.get('/proactive-insights', authMiddleware, controller.getProactiveInsights);

module.exports = router;
