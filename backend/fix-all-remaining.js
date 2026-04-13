const fs = require('fs');
const path = require('path');

console.log('Fixing ALL remaining logger imports...');

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace ALL unifiedLogger imports with correct logger imports
    content = content.replace(/require\(['"'][^'"]*unifiedLogger['"']\)/g, "require('./utils/logger')");
    
    // For files in subdirectories, adjust the path
    const relativePath = path.relative(__dirname, filePath);
    if (relativePath.includes('/') || relativePath.includes('\\')) {
      content = content.replace(/require\(['"']\.\/utils\/logger['"']\)/g, "require('../utils/logger')");
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${relativePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

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

// Process all files
const allJsFiles = getAllJsFiles(__dirname);
let fixedCount = 0;

allJsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('unifiedLogger')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

console.log(`\nCompleted! Fixed ${fixedCount} files.`);
