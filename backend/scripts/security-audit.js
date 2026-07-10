const logger = require('../utils/logger');

#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.debug('🔍 Running npm audit...');

try {
    // Run npm audit
    const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const audit = JSON.parse(auditOutput);
    
    if (audit.metadata.vulnerabilities.total === 0) {
        logger.debug('✅ No vulnerabilities found!');
        process.exit(0);
    }
    
    logger.debug(`\n⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities\n`);
    
    // Breakdown by severity
    const vulns = audit.metadata.vulnerabilities;
    logger.debug('Severity breakdown:');
    logger.debug(`  Critical: ${vulns.critical}`);
    logger.debug(`  High: ${vulns.high}`);
    logger.debug(`  Moderate: ${vulns.moderate}`);
    logger.debug(`  Low: ${vulns.low}\n`);
    
    // List critical and high severity issues
    const vulnerabilities = Object.values(audit.vulnerabilities || {});
    const severeVulns = vulnerabilities.filter(v => 
        v.severity === 'critical' || v.severity === 'high'
    );
    
    if (severeVulns.length > 0) {
        logger.debug('🚨 Critical/High Severity Issues:\n');
        
        severeVulns.forEach(vuln => {
            logger.debug(`Package: ${vuln.name}`);
            logger.debug(`Severity: ${vuln.severity}`);
            logger.debug(`Vulnerable versions: ${vuln.vulnerable_versions}`);
            logger.debug(`Patched in: ${vuln.patched_versions}`);
            logger.debug(`Overview: ${vuln.overview || 'N/A'}`);
            logger.debug(`Recommendation: ${vuln.recommendation || 'Run npm audit fix'}`);
            logger.debug('---\n');
        });
        
        // Try to auto-fix
        logger.debug('Attempting automatic fix...\n');
        try {
            execSync('npm audit fix', { stdio: 'inherit' });
            logger.debug('\n✅ Auto-fix completed. Re-running audit...\n');
            
            // Re-run audit to check remaining issues
            const newAuditOutput = execSync('npm audit --json', { encoding: 'utf8' });
            const newAudit = JSON.parse(newAuditOutput);
            
            if (newAudit.metadata.vulnerabilities.total === 0) {
                logger.debug('✅ All vulnerabilities fixed!');
                process.exit(0);
            } else {
                logger.debug(`⚠️  ${newAudit.metadata.vulnerabilities.total} vulnerabilities remain.`);
                logger.debug('Manual intervention may be required.');
            }
        } catch (fixError) {
            logger.error('❌ Automatic fix failed. Manual intervention required.');
        }
    }
    
    // Exit with error code if critical/high vulnerabilities exist
    if (severeVulns.length > 0) {
        process.exit(1);
    }
    
} catch (error) {
    if (error.status === 1) {
        // npm audit found vulnerabilities but ran successfully
        logger.debug(error.stdout || error.message);
        process.exit(1);
    } else {
        logger.error('❌ Error running npm audit:', error.message);
        process.exit(2);
    }
}
