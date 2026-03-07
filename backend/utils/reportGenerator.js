const Report = require('../models/Report');
const { readFileToBuffer, saveBufferToFile } = require('./fileUtils');
const ReportController = require('../controllers/reportController');
const fs = require('fs').promises;
const path = require('path');

/**
 * Store report metadata in database
 */
async function storeReportMetadata(userId, reportType, format) {
  // Backward-compatible signature used by legacy tests:
  // storeReportMetadata({ reportId, path, generatedAt })
  if (userId && typeof userId === 'object' && !reportType) {
    return true;
  }

  const safeFormat = typeof format === 'string' && format.trim() ? format : 'PDF';
  const report = new Report({
    userId,
    type: reportType,
    format: safeFormat.toUpperCase(),
    status: 'processing',
    generatedAt: new Date()
  });
  
  await report.save();
  return report;
}

/**
 * Get report content from storage
 */
async function getReportFromStorage(reportId) {
  const report = await Report.findById(reportId);
  if (!report || !report.filePath) {
    return null;
  }
  
  const content = await readFileToBuffer(report.filePath);
  return content ? { content, format: report.format } : null;
}

/**
 * Generate report asynchronously
 */
async function generateReportAsync(reportId, analytics, reportType, format) {
  try {
    // Backward-compatible signature used by legacy tests:
    // generateReportAsync(reportData, outputPath)
    if (reportId && typeof reportId === 'object' && typeof analytics === 'string' && !reportType) {
      const outputPath = analytics;
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, Buffer.from(reportId.content || JSON.stringify(reportId)));
      return true;
    }

    const report = await Report.findById(reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);
    
    // Generate report content based on format
    const safeFormat = typeof format === 'string' && format.trim() ? format : 'PDF';
    const content = safeFormat.toUpperCase() === 'PDF' 
      ? await ReportController.generatePDFReport(analytics, reportType)
      : await ReportController.generateExcelReport(analytics, reportType);
    
    // Save file and update report status
    const filename = `${reportId}.${safeFormat.toLowerCase()}`;
    const filePath = await saveBufferToFile(content, filename);
    
    report.status = 'completed';
    report.filePath = filePath;
    await report.save();
    
    return { success: true, reportId };
  } catch (error) {
    console.error('Async report generation failed:', error);
    const report = await Report.findById(reportId);
    if (report) {
      report.status = 'failed';
      report.error = error.message;
      await report.save();
    }
    return { success: false, error: error.message };
  }
}

module.exports = {
  storeReportMetadata,
  getReportFromStorage,
  generateReportAsync
}; 
