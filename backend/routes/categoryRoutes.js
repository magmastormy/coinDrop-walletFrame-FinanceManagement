const express = require('express');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();
// Create a new category
router.post('/', CategoryController.createCategory);
// Get all categories
router.get('/', CategoryController.getAllCategories);
// Update a category
router.put('/:id', CategoryController.updateCategory);
// Delete a category
router.delete('/:id', CategoryController.deleteCategory);
module.exports = router;