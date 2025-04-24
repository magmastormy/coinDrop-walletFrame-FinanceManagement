// backend/ai/categoryAIService.js
const mongoose = require('mongoose');
const Category = require('../models/Category');
const CategoryAIModel = require('./categoryAIModel');

class CategoryAIService {
  constructor() {
    this.cache = new Map(); // In-memory cache for frequent matches
  }

  async initialize() {
    try {
      const categories = await Category.find({});
      await CategoryAIModel.loadCategories(categories);
      console.log('AI Service initialized with', categories.length, 'categories');
    } catch (error) {
      console.error('AI Service initialization failed:', error);
      throw error;
    }
  }

  async matchOrCreateCategory(description) {
    if (this.cache.has(description)) {
      return this.cache.get(description);
    }

    const predictedCategory = await CategoryAIModel.predictCategory(description);
    if (predictedCategory) {
      this.cache.set(description, predictedCategory);
      return predictedCategory;
    }

    // Fallback: Uncategorized
    const uncategorized = await Category.findOne({ name: 'Uncategorized' });
    return uncategorized || await Category.create({ name: 'Uncategorized' });
  }
}

module.exports = new CategoryAIService();