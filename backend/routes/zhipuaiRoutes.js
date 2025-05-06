const express = require('express');
const router = express.Router();
const controller = require('../controllers/zhipuaiController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/send', authMiddleware, controller.sendMessage);

router.get('/user-context/:userId', authMiddleware, controller.getUserContext);
router.get('/context-suggestions/:userId', authMiddleware, controller.getContextSuggestions);
router.get('/user-account-info/:userId', authMiddleware, controller.getUserAccountInfo);
router.get('/proactive-insights/:userId', authMiddleware, controller.getProactiveInsights);

module.exports = router;