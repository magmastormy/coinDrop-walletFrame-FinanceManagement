const express = require('express');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all category routes
router.use(authMiddleware);

router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getUserCategories);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;