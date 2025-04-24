// backend/ai/categoryAIService.js
const CategoryAIModel = require('./categoryAIModel');
const { Category } = require('../models/Category');

class CategoryAIService {
  constructor() {
    this.cache = new Map(); // In-memory cache for frequent matches
  }

  async initialize() {
    const categories = await Category.find({});
    await CategoryAIModel.loadCategories(categories);
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