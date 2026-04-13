const logger = require('../utils/logger');

// backend/ai/categoryAIService.js
const mongoose = require('mongoose');
const Category = require('../models/Category');
const CategoryAIModel = require('./categoryAIModel');
const cacheUtil = require('../utils/cacheUtil');

class CategoryAIService {
  constructor() {
    // Using Redis cache instead of in-memory Map
  }

  async initialize() {
    try {
      const categories = await Category.find({});
      await CategoryAIModel.loadCategories(categories);
      logger.debug('AI Service initialized with', categories.length, 'categories');
    } catch (error) {
      logger.error('AI Service initialization failed:', error);
      throw error;
    }
  }

  async matchOrCreateCategory(description) {
    // Generate cache key
    const cacheKey = cacheUtil.generateKey('category_match', description);
    
    // Try to get from cache first
    const cachedCategory = await cacheUtil.get(cacheKey);
    if (cachedCategory) {
      return cachedCategory;
    }

    // Check learning cache first (user corrections have priority)
    const key = description.toLowerCase().trim();
    const learnedCategoryId = CategoryAIModel.learningCache.get(key);
    if (learnedCategoryId) {
      const category = await Category.findById(learnedCategoryId);
      if (category) {
        logger.debug('[CategoryAIService] Using learned category for:', description);
        // Cache the result
        await cacheUtil.set(cacheKey, category.toObject(), 86400); // Cache for 24 hours
        return category;
      }
    }

    const predictedCategory = await CategoryAIModel.predictCategory(description);
    if (predictedCategory) {
      // Cache the result
      await cacheUtil.set(cacheKey, predictedCategory, 86400); // Cache for 24 hours
      return predictedCategory;
    }

    // Fallback: Uncategorized
    const uncategorized = await Category.findOne({ name: 'Uncategorized' });
    const fallbackCategory = uncategorized || await Category.create({ name: 'Uncategorized' });
    // Cache the fallback
    await cacheUtil.set(cacheKey, fallbackCategory.toObject(), 86400); // Cache for 24 hours
    return fallbackCategory;
  }

  /**
   * Learn from user manual categorization
   */
  async learnCategory(description, categoryId) {
    await CategoryAIModel.learnCorrection(description, categoryId);
    
    // Invalidate and update cache
    const cacheKey = cacheUtil.generateKey('category_match', description);
    const category = await Category.findById(categoryId);
    if (category) {
      // Update the cache with the new category
      await cacheUtil.set(cacheKey, category.toObject(), 86400); // Cache for 24 hours
    }
  }
}

module.exports = new CategoryAIService();