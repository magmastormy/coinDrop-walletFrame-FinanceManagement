const logger = require('../utils/logger');

const CategoryService = require('../services/categoryService');

async function initializeAI() {
  await CategoryService.initialize();
  logger.debug('[CategoryInit - Initialize AI] AI services initialized');
}

module.exports = initializeAI;