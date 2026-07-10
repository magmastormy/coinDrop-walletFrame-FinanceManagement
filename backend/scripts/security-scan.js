const logger = require('../utils/logger');

#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.debug('🔒 Starting security scan...');

// Check if npm is available
try {
    execSync('npm --version', { stdio: 'ignore' });
} catch (error) {
    logger.error('❌ npm is not available. Please install Node.js and npm.');
    process.exit(1);
}

// 1. Check for vulnerable dependencies
logger.debug('\n🔍 Scanning for vulnerable dependencies...');
try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResults = JSON.parse(auditOutput);
    
    if (auditResults.advisories) {
        const vulnerabilities = Object.values(auditResults.advisories);
        const highSeverity = vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical');
        
        if (highSeverity.length > 0) {
            logger.error('❌ High severity vulnerabilities found:');
            highSeverity.forEach(vuln => {
                logger.error(`  - ${vuln.title} (${vuln.severity}): ${vuln.url}`);
            });
        } else {
            logger.debug('✅ No high severity vulnerabilities found.');
        }
        
        if (vulnerabilities.length > 0) {
            logger.debug(`\n📊 Total vulnerabilities: ${vulnerabilities.length}`);
            logger.debug('Run "npm audit fix" to fix some of these vulnerabilities.');
        }
    } else {
        logger.debug('✅ No vulnerabilities found.');
    }
} catch (error) {
    logger.error('❌ Error running npm audit:', error.message);
}

// 2. Check for outdated dependencies
logger.debug('\n🔍 Checking for outdated dependencies...');
try {
    const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedPackages = JSON.parse(outdatedOutput);
    
    if (Object.keys(outdatedPackages).length > 0) {
        logger.debug('📋 Outdated packages:');
        Object.entries(outdatedPackages).forEach(([pkg, info]) => {
            logger.debug(`  - ${pkg}: ${info.current} → ${info.latest}`);
        });
        logger.debug('\nRun "npm update" to update these packages.');
    } else {
        logger.debug('✅ All dependencies are up to date.');
    }
} catch (error) {
    logger.error('❌ Error checking for outdated dependencies:', error.message);
}

// 3. Check for security best practices
logger.debug('\n🔍 Checking for security best practices...');

// Check for .env file
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
    logger.debug('✅ .env file found.');
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Check for sensitive keys in .env
    const sensitiveKeys = ['JWT_SECRET', 'DATABASE_URL', 'ENCRYPTION_KEY'];
    const missingKeys = sensitiveKeys.filter(key => !envContent.includes(key));
    
    if (missingKeys.length > 0) {
        logger.error('❌ Missing sensitive keys in .env:');
        missingKeys.forEach(key => logger.error(`  - ${key}`));
    } else {
        logger.debug('✅ All sensitive keys found in .env.');
    }
} else {
    logger.error('❌ .env file not found.');
}

// Check for helmet middleware
const appFile = path.join(__dirname, '..', 'app.js');
if (fs.existsSync(appFile)) {
    const appContent = fs.readFileSync(appFile, 'utf8');
    const securityHeaders = [
        'Strict-Transport-Security',
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
    ];
    
    const foundHeaders = securityHeaders.filter(header => appContent.includes(header));
    if (foundHeaders.length === securityHeaders.length) {
        logger.debug('✅ All security headers implemented.');
    } else {
        logger.warn('⚠️  Missing some security headers:');
        securityHeaders.filter(header => !foundHeaders.includes(header)).forEach(header => {
            logger.warn(`  - ${header}`);
        });
    }
}

logger.debug('\n🔒 Security scan completed!');
