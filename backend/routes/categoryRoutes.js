const express = require('express');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');
const { body, param, query } = require('express-validator');
const { fieldFilters } = require('../middleware/fieldFilterMiddleware');
const CategoryService = require('../services/categoryService');

// Validation rules
const createCategoryValidation = [
    body('name').notEmpty().withMessage('Name is required').isString().trim().isLength({ max: 100 }),
    body('type').notEmpty().withMessage('Type is required').isIn(['income', 'expense']),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
    body('icon').optional().isString(),
    body('description').optional().isString().isLength({ max: 255 }),
    body('parentId').optional().isMongoId()
];

const updateCategoryValidation = [
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ max: 100 }),
    body('type').optional().isIn(['income', 'expense']),
    body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
    body('icon').optional().isString(),
    body('description').optional().isString().isLength({ max: 255 }),
    body('parentId').optional().isMongoId()
];

const categoryQueryValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['income', 'expense']),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc'])
];

// Protect all category routes
router.use(authMiddleware);

// Basic CRUD operations with field filtering
router.post('/', sanitizationMiddleware, fieldFilters.categoryCreate, createCategoryValidation, validationMiddleware, CategoryController.createCategory);
router.get('/', sanitizationMiddleware, fieldFilters.categoryQuery, categoryQueryValidation, validationMiddleware, CategoryController.getUserCategories);
router.put('/:id', sanitizationMiddleware, fieldFilters.categoryUpdate, updateCategoryValidation, validationMiddleware, CategoryController.updateCategory);
router.delete('/:id', sanitizationMiddleware, CategoryController.deleteCategory);

// New hierarchy endpoints
router.get('/hierarchy', sanitizationMiddleware, CategoryController.getCategoryHierarchy);
router.get('/:id/subcategories', sanitizationMiddleware, CategoryController.getSubcategories);
router.post('/:id/subcategories', sanitizationMiddleware, fieldFilters.categoryUpdate, CategoryController.addSubcategory);
router.put('/:id/parent', sanitizationMiddleware, fieldFilters.categoryUpdate, CategoryController.updateParentCategory);

// Budget integration endpoints
router.get('/:id/budgets', sanitizationMiddleware, CategoryController.getCategoryBudgets);
router.get('/:id/transactions', sanitizationMiddleware, CategoryController.getCategoryTransactions);
router.get('/:id/stats', sanitizationMiddleware, CategoryController.getCategoryStats);

// Auto-categorization endpoints
router.get('/patterns', sanitizationMiddleware, CategoryController.getCategoryPatterns);
router.post('/auto-categorize/patterns', sanitizationMiddleware, CategoryController.updateCategoryPatterns);
router.post('/auto-categorize/suggest', sanitizationMiddleware, CategoryController.suggestCategory);
router.post('/auto-categorize/train', sanitizationMiddleware, CategoryController.trainCategoryModel);
router.post('/auto-categorize/batch', sanitizationMiddleware, CategoryController.batchCategorizeTransactions);

// New endpoint for AI suggestions
router.get('/suggest', sanitizationMiddleware, async (req, res) => {
  try {
    const { description } = req.query;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const suggestedCategory = await CategoryService.suggestCategory(description);
    res.json(suggestedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;