const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const ProfileController = require('../controllers/profileController');
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('[ProfileRoute] Not an image! Please upload an image.'), false);
        }
    }
});

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
router.get('/me', ProfileController.getProfile);
router.post('/me', ProfileController.createProfile);
router.put('/me', ProfileController.updateProfile);
router.delete('/me', ProfileController.deleteProfile);
router.post('/me/upload-image', upload.single('image'), ProfileController.uploadProfileImage);
router.delete('/me/delete-image', ProfileController.deleteProfileImage);

module.exports = router;
