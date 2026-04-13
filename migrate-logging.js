#!/usr/bin/env node

/**
 * Logging Migration Script
 * 
 * This script automatically migrates all console.log and console.error calls
 * to use the unified logger system (frontend or backend).
 * 
 * Usage:
 *   node migrate-logging.cjs --frontend|--backend [--dry-run]
 * 
 * Options:
 *   --frontend: Migrate frontend files (src/ directory)
 *   --backend: Migrate backend files (backend/ directory)
 *   --dry-run: Show what would be changed without making changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LoggingMigrator {
    constructor() {
        this.isFrontend = process.argv.includes('--frontend');
        this.isBackend = process.argv.includes('--backend');
        this.isDryRun = process.argv.includes('--dry-run');
        
        if (!this.isFrontend && !this.isBackend) {
            console.error('❌ Error: Must specify either --frontend or --backend');
            process.exit(1);
        }
        
        this.rootDir = this.isFrontend ? 'src' : 'backend';
        this.loggerImport = this.isFrontend 
            ? "import { useLogger } from './hooks/useLogger';"
            : "const logger = require('./utils/unifiedLogger');";
        
        this.stats = {
            filesProcessed: 0,
            consoleLogsFound: 0,
            consoleErrorsFound: 0,
            migrationsMade: 0,
            errors: []
        };
    }

    /**
     * Find all JavaScript/JSX files in the directory
     */
    findFiles(dir) {
        const files = [];
        
        function walkDir(currentDir) {
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
        }
        
        walkDir(dir);
        return files;
    }

    /**
     * Extract logging calls from a file
     */
    extractLoggingCalls(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const loggingCalls = [];
            
            lines.forEach((line, index) => {
                // Match console.log calls
                const logMatch = line.match(/console\.log\s*\(([^)]+)\)/);
                if (logMatch) {
                    loggingCalls.push({
                        type: 'log',
                        line: index + 1,
                        content: logMatch[1],
                        fullLine: line
                    });
                }
                
                // Match console.error calls
                const errorMatch = line.match(/console\.error\s*\(([^)]+)\)/);
                if (errorMatch) {
                    loggingCalls.push({
                        type: 'error',
                        line: index + 1,
                        content: errorMatch[1],
                        fullLine: line
                    });
                }
                
                // Match console.warn calls
                const warnMatch = line.match(/console\.warn\s*\(([^)]+)\)/);
                if (warnMatch) {
                    loggingCalls.push({
                        type: 'warn',
                        line: index + 1,
                        content: warnMatch[1],
                        fullLine: line
                    });
                }
                
                // Match console.info calls
                const infoMatch = line.match(/console\.info\s*\(([^)]+)\)/);
                if (infoMatch) {
                    loggingCalls.push({
                        type: 'info',
                        line: index + 1,
                        content: infoMatch[1],
                        fullLine: line
                    });
                }
            });
            
            return loggingCalls;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * Generate the replacement for a logging call
     */
    generateReplacement(loggingCall) {
        const { type, content } = loggingCall;
        
        if (this.isFrontend) {
            // Frontend: Use React hook
            const loggerVar = type === 'error' ? 'logError' : 'logInfo';
            return `const { ${loggerVar} } = useLogger();\n${loggerVar}(${content});`;
        } else {
            // Backend: Use unified logger
            const loggerMethod = type === 'error' ? 'error' : 
                                 type === 'warn' ? 'warn' : 
                                 type === 'info' ? 'info' : 'debug';
            
            // Try to extract context for better logging
            const contextMatch = content.match(/,\s*({[^}]+)\s*\)/);
            const context = contextMatch ? contextMatch[1] : '{}';
            
            return `logger.${loggerMethod}(${content}, ${context});`;
        }
    }

    /**
     * Migrate a single file
     */
    migrateFile(filePath) {
        try {
            const loggingCalls = this.extractLoggingCalls(filePath);
            
            if (loggingCalls.length === 0) {
                return; // No logging calls to migrate
            }
            
            this.stats.filesProcessed++;
            this.stats.consoleLogsFound += loggingCalls.filter(c => c.type === 'log').length;
            this.stats.consoleErrorsFound += loggingCalls.filter(c => c.type === 'error').length;
            
            if (this.isDryRun) {
                console.log(`🔍 DRY RUN - ${filePath}`);
                console.log(`   Found ${loggingCalls.length} logging calls:`);
                loggingCalls.forEach(call => {
                    console.log(`     ${call.type.toUpperCase()}: ${call.fullLine}`);
                });
                console.log(`   Would replace with: ${this.generateReplacement(call)}`);
                return;
            }
            
            // Read the file content
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Add logger import at the top
            let modifiedContent = this.loggerImport + '\n\n';
            let hasLoggerImport = false;
            
            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check if line already has logger import
                if (line.includes('useLogger') || line.includes('unifiedLogger')) {
                    hasLoggerImport = true;
                }
                
                // Find and replace logging calls
                const loggingCall = this.extractLoggingCalls(filePath).find(call => call.line === i + 1);
                
                if (loggingCall) {
                    const replacement = this.generateReplacement(loggingCall);
                    lines[i] = replacement;
                    this.stats.migrationsMade++;
                }
            }
            
            // Add logger import if not present
            if (!hasLoggerImport && this.stats.migrationsMade > 0) {
                modifiedContent = this.loggerImport + '\n\n' + modifiedContent;
            }
            
            // Write back the modified content
            if (this.stats.migrationsMade > 0) {
                fs.writeFileSync(filePath, modifiedContent);
                console.log(`✅ Migrated ${filePath} (${this.stats.migrationsMade} changes)`);
            }
            
        } catch (error) {
            this.stats.errors.push(`Error migrating ${filePath}: ${error.message}`);
            console.error(`❌ Error migrating ${filePath}:`, error.message);
        }
    }

    /**
     * Run the migration
     */
    async run() {
        console.log(`🚀 Starting logging migration for ${this.rootDir}...`);
        
        const files = this.findFiles(this.rootDir);
        console.log(`📁 Found ${files.length} files to process`);
        
        for (const file of files) {
            this.migrateFile(file);
        }
        
        // Print summary
        console.log('\n📊 Migration Summary:');
        console.log(`   Files processed: ${this.stats.filesProcessed}`);
        console.log(`   Console.log calls found: ${this.stats.consoleLogsFound}`);
        console.log(`   Console.error calls found: ${this.stats.consoleErrorsFound}`);
        console.log(`   Migrations made: ${this.stats.migrationsMade}`);
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.stats.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (this.stats.migrationsMade > 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('💡 Next steps:');
            console.log('   1. Test your application');
            console.log('   2. Check logs in browser console or backend logs');
            console.log('   3. Run tests to verify functionality');
        } else {
            console.log('\n✅ No migrations needed - all files already use unified logger');
        }
    }
}

// Main execution
if (require.main === module) {
    const migrator = new LoggingMigrator();
    migrator.run();
}

module.exports = LoggingMigrator;
