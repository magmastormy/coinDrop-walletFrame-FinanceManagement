const logger = require('../utils/logger');

// backend/services/categoryService.js
const mongoose = require('mongoose');
const Category = require('../models/Category');
const CategoryAIModel = require('../ai/categoryAIModel');
const CategoryAIService = require('../ai/categoryAIService');

class CategoryService {
  async initialize() {
    await CategoryAIService.initialize();
  }

  async suggestCategory(description) {
    return await CategoryAIService.matchOrCreateCategory(description);
  }

  // Non-AI methods (e.g., CRUD)
  async createCategory(name, parentId) {
    return await Category.create({ name, parentId });
  }

  async listCategories() {
    return await Category.find({});
  }

  async handleUserSelection(userId, transactionDescription, selectedCategory) {
    if (!selectedCategory.isNew) return selectedCategory;

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${selectedCategory.name}$`, 'i') },
      userId 
    });

    if (existingCategory) {
      logger.debug(`Category "${selectedCategory.name}" already exists. Reusing it.`);
      return { ...existingCategory.toObject(), isNew: false };
    }

    // Create new category if it doesn't exist
    const newCategory = await Category.create({
      name: selectedCategory.name,
      userId,
      patterns: [selectedCategory.suggestedPattern]
    });

    await CategoryAIModel.loadCategories(await Category.find({ userId }));
    return { ...newCategory.toObject(), isNew: false };
  }

  async handleCategory(categoryData, userId) {
    // 1. Always use existing category if possible
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') },
      userId
    });

    if (existingCategory) return existingCategory;

    // 2. Create new category only if explicitly flagged as new
    if (categoryData.isNew) {
      const newCategory = await Category.create({
        name: categoryData.name.trim(),
        userId,
        isSystemGenerated: true
      });
      return newCategory;
    }

    // 3. Fallback (should never happen with proper UI controls)
    throw new Error(`Category "${categoryData.name}" doesn't exist`);
  }

  async getDefaultCategory(userId) {
    // Try to find an existing "Other" category
    let defaultCategory = await Category.findOne({
      name: { $regex: /^other$/i },
      userId
    });

    // If no "Other" category exists, create one
    if (!defaultCategory) {
      defaultCategory = await Category.create({
        name: 'Other',
        userId,
        isSystemGenerated: true
      });
    }

    return defaultCategory;
  }
}

module.exports = new CategoryService();