const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const CommunityController = require('../controllers/communityController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware } = require('../middleware/validationMiddleware');

// Post Validation Middleware
const postValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('content')
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('Content must be between 10 and 2000 characters'),
    body('category')
        .isIn([
            'Finance Tips', 
            'Investment Advice', 
            'Budgeting', 
            'Debt Management', 
            'Savings Strategies', 
            'General Discussion'
        ]).withMessage('Invalid post category'),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    body('visibility')
        .optional()
        .isIn(['public', 'private', 'followers']).withMessage('Invalid visibility setting')
];

// Comment Validation Middleware
const commentValidation = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
];

// Search Validation Middleware
const searchValidation = [
    query('query')
        .trim()
        .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
];

// Protect all community routes
router.use(authMiddleware);

// Post Routes
router.post('/', 
    postValidation, 
    validationMiddleware, 
    CommunityController.createPost
);

router.get('/', 
    CommunityController.getPosts
);

router.get('/search', 
    searchValidation, 
    validationMiddleware, 
    CommunityController.searchPosts
);

router.get('/stats', CommunityController.getCommunityStats);

router.get('/:id', CommunityController.getPostById);

router.put('/:id', 
    postValidation, 
    validationMiddleware, 
    CommunityController.updatePost
);

router.delete('/:id', CommunityController.deletePost);

// Comment Routes
router.post('/:postId/comments', 
    commentValidation, 
    validationMiddleware, 
    CommunityController.addComment
);

router.delete('/:postId/comments/:commentId', 
    CommunityController.deleteComment
);

// Like Routes
router.post('/:postId/like', CommunityController.toggleLike);

// Community Budget Routes
router.post('/:postId/budget', 
    CommunityController.createCommunityBudget
);

router.get('/:postId/budget', 
    CommunityController.getCommunityBudget
);

router.post('/:postId/budget/contribute', 
    CommunityController.contributeToBudget
);

router.patch('/:postId/budget/status', 
    CommunityController.updateCommunityBudgetStatus
);

module.exports = router;
