const CategoryService = require('./services/categoryService');

async function initializeAI() {
  await CategoryService.initialize();
  console.log('[CategoryInit - Initialize AI] AI services initialized');
}

modules.export = initializeAI;