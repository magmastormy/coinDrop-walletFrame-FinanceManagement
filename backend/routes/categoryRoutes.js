const express = require('express');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all category routes
router.use(authMiddleware);

// Basic CRUD operations
router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getUserCategories);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

// New hierarchy endpoints
router.get('/hierarchy', CategoryController.getCategoryHierarchy);
router.get('/:id/subcategories', CategoryController.getSubcategories);
router.post('/:id/subcategories', CategoryController.addSubcategory);
router.put('/:id/parent', CategoryController.updateParentCategory);

// Budget integration endpoints
router.get('/:id/budgets', CategoryController.getCategoryBudgets);
router.get('/:id/transactions', CategoryController.getCategoryTransactions);
router.get('/:id/stats', CategoryController.getCategoryStats);

// Auto-categorization endpoints
router.get('/patterns', CategoryController.getCategoryPatterns);
router.post('/auto-categorize/patterns', CategoryController.updateCategoryPatterns);
router.post('/auto-categorize/suggest', CategoryController.suggestCategory);
router.post('/auto-categorize/train', CategoryController.trainCategoryModel);
router.post('/auto-categorize/batch', CategoryController.batchCategorizeTransactions);

module.exports = router;