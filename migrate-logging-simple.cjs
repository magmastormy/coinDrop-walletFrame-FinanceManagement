#!/usr/bin/env node

/**
 * Simple Logging Migration Script
 * Migrates all console.* calls to unified logger
 */

const fs = require('fs');
const path = require('path');

const isBackend = process.argv.includes('--backend');
const isFrontend = process.argv.includes('--frontend');
const isDryRun = process.argv.includes('--dry-run');

if (!isBackend && !isFrontend) {
    console.error('❌ Must specify --backend or --frontend');
    process.exit(1);
}

const rootDir = isBackend ? 'backend' : 'src';
const loggerImport = isFrontend 
    ? "import { useLogger } from './hooks/useLogger';"
    : "const logger = require('./utils/unifiedLogger');";

function findFiles(dir) {
    const files = [];
    
    function walkDir(currentDir) {
        try {
            const items = fs.readdirSync(currentDir);
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    walkDir(fullPath);
                } else if (fullPath.match(/\.(js|jsx)$/)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    walkDir(dir);
    return files;
}

function migrateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let newContent = content;
        
        // Replace console.log
        if (content.includes('console.log')) {
            modified = true;
            newContent = newContent.replace(/console\.log\(/g, isFrontend ? 'logInfo(' : 'logger.debug(');
        }
        
        // Replace console.error
        if (content.includes('console.error')) {
            modified = true;
            newContent = newContent.replace(/console\.error\(/g, isFrontend ? 'logError(' : 'logger.error(');
        }
        
        // Replace console.warn
        if (content.includes('console.warn')) {
            modified = true;
            newContent = newContent.replace(/console\.warn\(/g, isFrontend ? 'logWarn(' : 'logger.warn(');
        }
        
        // Replace console.info
        if (content.includes('console.info')) {
            modified = true;
            newContent = newContent.replace(/console\.info\(/g, isFrontend ? 'logInfo(' : 'logger.info(');
        }
        
        // Add logger import if needed
        if (modified && !content.includes('useLogger') && !content.includes('unifiedLogger')) {
            modified = true;
            newContent = loggerImport + '\n\n' + newContent;
        }
        
        if (modified) {
            console.log(`${isDryRun ? '🔍 DRY RUN - Would update:' : '✅ Updated:'} ${filePath}`);
            if (isDryRun) {
                console.log(`   Found console.* calls`);
            } else {
                fs.writeFileSync(filePath, newContent);
            }
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Run migration
console.log(`🚀 ${isDryRun ? 'DRY RUN - ' : ''}Migrating ${rootDir} logging...`);

const files = findFiles(rootDir);
console.log(`📁 Found ${files.length} files`);

let migratedCount = 0;
let errorCount = 0;

for (const file of files) {
    try {
        if (migrateFile(file)) {
            migratedCount++;
        }
    } catch (error) {
        errorCount++;
        console.error(`❌ Error with ${file}:`, error.message);
    }
}

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${files.length}`);
console.log(`   Files migrated: ${migratedCount}`);
console.log(`   Errors: ${errorCount}`);

if (!isDryRun && migratedCount > 0) {
    console.log(`\n✅ Migration complete!`);
    console.log(`💡 Next steps:`);
    console.log(`   1. Test the application`);
    console.log(`   2. Check for any broken imports`);
    console.log(`   3. Run tests to verify functionality`);
}
