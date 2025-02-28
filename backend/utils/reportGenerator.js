const Report = require('../models/Report');
const fs = require('fs').promises;
const path = require('path');
const ReportController = require('../controllers/reportController');

const REPORTS_DIR = path.join(__dirname, '../reports');

async function storeReportMetadata(reportId, reportData) {
    const report = new Report({
        _id: reportId,
        userId: reportData.userId,
        type: reportData.reportType,
        format: reportData.format,
        status: 'processing'
    });
    
    await report.save();
    return report;
}

async function getReportFromStorage(reportId) {
    const report = await Report.findById(reportId);
    if (!report || !report.filePath) {
        return null;
    }
    
    const content = await fs.readFile(report.filePath);
    return {
        content,
        format: report.format
    };
}

async function generateReportAsync(reportId, reportData) {
    try {
        // Ensure reports directory exists
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        
        const report = await Report.findById(reportId);
        const filePath = path.join(REPORTS_DIR, `${reportId}.${reportData.format.toLowerCase()}`);
        
        // Generate report using ReportController methods
        const content = reportData.format === 'PDF' 
            ? await ReportController.generatePDFReport(reportData, reportData.reportType)
            : await ReportController.generateExcelReport(reportData, reportData.reportType);
            
        await fs.writeFile(filePath, content);
        
        // Update report status
        report.status = 'completed';
        report.filePath = filePath;
        await report.save();
    } catch (error) {
        console.error('Async report generation failed:', error);
        const report = await Report.findById(reportId);
        report.status = 'failed';
        await report.save();
    }
}

module.exports = {
    storeReportMetadata,
    getReportFromStorage,
    generateReportAsync
}; 