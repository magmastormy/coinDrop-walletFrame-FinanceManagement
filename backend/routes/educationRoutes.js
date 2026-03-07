const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const EducationController = require('../controllers/educationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware } = require('../middleware/validationMiddleware');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});


const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Education Validation Middleware
const educationValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('details')
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('Details must be between 10 and 2000 characters')
];

// Protect all education routes
router.use(authMiddleware);

router.post('/', educationValidation, validationMiddleware, EducationController.createEducation);
router.get('/', EducationController.getEducations);
router.get('/user', EducationController.getUserEducations);
router.get('/:id', EducationController.getEducationById);
router.put('/:id', educationValidation, validationMiddleware, EducationController.updateEducation);
router.delete('/:id', EducationController.deleteEducation);
router.post('/:id/like', EducationController.likeEducation);
router.post('/:id/comments', body('text').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'), validationMiddleware, EducationController.addComment);
router.delete('/:id/comments/:commentId', EducationController.deleteComment);
router.post('/upload-image', upload.single('image'), EducationController.uploadImage);
module.exports = router;
