const fs = require('fs');
const path = require('path');

console.log('Finding duplicate logger declarations...');

// Get all JS files recursively
function getAllJsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('coverage')) {
        getAllJsFiles(filePath, fileList);
      } else if (file.endsWith('.js') && !file.includes('node_modules') && !file.includes('coverage')) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return fileList;
}

const allJsFiles = getAllJsFiles(__dirname);

allJsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath);
    
    // Count logger declarations
    const loggerDeclarations = content.match(/const logger = require\([^)]+\)/g) || [];
    
    if (loggerDeclarations.length > 1) {
      console.log(`\n🚨 DUPLICATE FOUND in ${relativePath}:`);
      loggerDeclarations.forEach((decl, index) => {
        console.log(`  ${index + 1}. ${decl}`);
      });
    } else if (loggerDeclarations.length === 1) {
      console.log(`✅ ${relativePath}: 1 declaration`);
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

console.log('\nScan complete!');
