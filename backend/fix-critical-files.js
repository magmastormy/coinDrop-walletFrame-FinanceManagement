const fs = require('fs');
const path = require('path');

console.log('Fixing critical files...');

// Critical files that must work for server to start
const criticalFiles = [
  'server.js',
  'app.js', 
  'config/db.js',
  'config/categoryInit.js',
  'config/databaseIndexes.js',
  'ai/categoryAIModel.js',
  'ai/categoryAIService.js',
  'middleware/auditMiddleware.js',
  'middleware/rateLimitingMiddleware.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace all unifiedLogger imports with correct logger imports
      content = content.replace(
        /require\(['"'][^'"]*unifiedLogger['"']\)/g,
        (match) => {
          // Determine correct path based on file location
          if (file.includes('config/') || file.includes('middleware/') || file.includes('ai/')) {
            return "require('../utils/logger')";
          } else {
            return "require('./utils/logger')";
          }
        }
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('Critical files fixed!');
