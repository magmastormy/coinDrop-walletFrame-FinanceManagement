const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const ProfileController = require('../controllers/profileController');

const router = express.Router();

// Validation middleware
const profileValidation = [
    body('bio').optional().trim().isLength({ max: 150 })
        .withMessage('Bio must not exceed 150 characters'),
    body('interests').optional().isArray()
        .withMessage('Interests must be an array'),
    body('phone').optional()
        .matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number format'),
    body('profilePicture').optional().isURL()
        .withMessage('Profile picture must be a valid URL'),
    body('coverPhoto').optional().isURL()
        .withMessage('Cover photo must be a valid URL'),
    body('preferences').optional().isObject()
        .withMessage('Preferences must be an object')
];

// Protected routes
router.use(authMiddleware);

// Profile routes
router.get('/:userId', ProfileController.getProfile);
router.put('/:userId', profileValidation, ProfileController.updateProfile);
router.post('/:userId', profileValidation, ProfileController.createProfile);
router.get('/:userId/followers', ProfileController.getFollowers);
router.get('/:userId/following', ProfileController.getFollowing);
router.delete('/:userId', ProfileController.deleteProfile);
module.exports = router;