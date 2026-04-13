const fs = require('fs');
const path = require('path');

// List of files that need to be fixed
const filesToFix = [
  'ai/categoryAIModel.js',
  'ai/categoryAIService.js', 
  'controllers/budgetController.js',
  'controllers/categoryController.js',
  'controllers/educationController.js',
  'controllers/notificationController.js',
  'controllers/profileController.js',
  'controllers/reportController.js',
  'controllers/savingsAccountController.js',
  'controllers/savingsGoalController.js',
  'controllers/savingsRuleController.js',
  'controllers/transactionController.js',
  'controllers/walletController.js',
  'controllers/zhipuaiController.js',
  'models/AuditLog.js',
  'models/User.js',
  'routes/receiptRoutes.js',
  'routes/reportRoutes.js',
  'services/cryptoService.js',
  'services/questionAnalyzer.js',
  'services/zhipuaiContextService.js',
  'services/imageService.js',
  'services/financialAnalyzerService.js',
  'services/contextEnhancementService.js',
  'services/categoryService.js',
  'services/budgetService.js',
  'services/aiClient.js',
  'services/formatters/contextFormatter.js',
  'services/formatters/enhancedContextFormatter.js',
  'scripts/k6-stress-test-fixed.js',
  'scripts/k6-wallet-consistency-fixed.js',
  'scripts/k6-wallet-dashboard-ai.js',
  'scripts/k6-exceptional-boundary-security.js',
  'scripts/k6-stress-test-fixed-part4.js',
  'scripts/k6-stress-test-fixed-part3.js',
  'scripts/k6-stress-test-fixed-part2.js',
  'scripts/k6-stress-test-fixed-complete.js',
  'scripts/k6-wallet-consistency-fixed-part4.js',
  'scripts/k6-stress-test-fixed.js',
  'scripts/k6-wallet-consistency.js',
  'scripts/k6-wallet-dashboard-ai.js',
  'scripts/mongo-benchmark.js',
  'scripts/security-audit.js',
  'scripts/generate-jwt-secret.js',
  'scripts/k6-exceptional-boundary-security.js',
  'scripts/test-encryption-utility.js',
  'scripts/test-transaction-encryption.js',
  'scripts/security-scan.js',
  'seeders/clearDatabase.js',
  'seeders/databaseSeeder.js',
  'seeders/registerUsers.js',
  'tests/categoryTestAIModel.js'
];

console.log('Starting to fix logger imports...');

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import statement
    content = content.replace(
      /require\(['"']\.\.\/utils\/unifiedLogger['"']\)/g,
      "require('../utils/logger')"
    );
    
    // For files in subdirectories, adjust the path
    if (file.includes('/') || file.includes('controllers/') || file.includes('services/') || file.includes('scripts/') || file.includes('seeders/') || file.includes('tests/')) {
      content = content.replace(
        /require\(['"']\.\.\/utils\/unifiedLogger['"']\)/g,
        "require('../../utils/logger')"
      );
    }
    
    // For files in root directory, use relative path
    else if (file.includes('models/') || file.includes('routes/') || file.includes('config/')) {
      content = content.replace(
        /require\(['"']\.\.\/utils\/unifiedLogger['"']\)/g,
        "require('./utils/logger')"
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error);
  }
});

console.log('Logger import fixes completed!');
