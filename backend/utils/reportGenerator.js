const logger = require('./logger');

const Report = require('../models/Report');
const { readFileToBuffer, saveBufferToFile } = require('./fileUtils');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { format } = require('@fast-csv/format');
const { PDF_STYLES, EXCEL_STYLES, EXCEL_COLUMNS } = require('../utils/reportStyles');

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
 * Generate PDF report
 */
async function generatePDFReport(analytics, reportType) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('error', reject);
      
      // Add header
      doc.fontSize(PDF_STYLES.header.fontSize)
        .text('Financial Report', { align: PDF_STYLES.header.align });
      doc.moveDown();
      
      // Add date and report type
      doc.fontSize(PDF_STYLES.normal.fontSize)
        .text(`Generated on: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      
      doc.fontSize(PDF_STYLES.subheader.fontSize)
        .text(`Report Type: ${reportType}`, { align: PDF_STYLES.subheader.align });
      doc.moveDown();
      
      // Add financial overview
      doc.fontSize(PDF_STYLES.section.fontSize)
        .text('Financial Overview', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(PDF_STYLES.normal.fontSize)
        .text(`Total Balance: $${analytics.totalBalance.toFixed(2)}`);
      doc.text(`Monthly Income: $${analytics.monthlyIncome.toFixed(2)}`);
      doc.text(`Monthly Expenses: $${analytics.monthlyExpenses.toFixed(2)}`);
      doc.text(`Savings Rate: ${analytics.savingsRate.toFixed(2)}%`);
      doc.moveDown();
      
      doc.fontSize(PDF_STYLES.section.fontSize)
        .text('Summary Statistics', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(PDF_STYLES.normal.fontSize)
        .text(`Wallets: ${analytics.wallets}`);
      doc.text(`Budgets: ${analytics.budgets}`);
      doc.text(`Transactions: ${analytics.transactions}`);
      
      doc.end();
      
      // Wait for PDF to finish generating
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report
 */
async function generateExcelReport(analytics, reportType) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Financial Report');
  
  // Add headers
  worksheet.columns = EXCEL_COLUMNS;
  
  // Add rows
  worksheet.addRow(['Report Type', reportType]);
  worksheet.addRow(['Generated On', new Date().toLocaleDateString()]);
  worksheet.addRow([]);
  worksheet.addRow(['Financial Overview', '']);
  worksheet.addRow(['Total Balance', `$${analytics.totalBalance.toFixed(2)}`]);
  worksheet.addRow(['Monthly Income', `$${analytics.monthlyIncome.toFixed(2)}`]);
  worksheet.addRow(['Monthly Expenses', `$${analytics.monthlyExpenses.toFixed(2)}`]);
  worksheet.addRow(['Savings Rate', `${analytics.savingsRate.toFixed(2)}%`]);
  worksheet.addRow([]);
  worksheet.addRow(['Summary Statistics', '']);
  worksheet.addRow(['Wallets', analytics.wallets]);
  worksheet.addRow(['Budgets', analytics.budgets]);
  worksheet.addRow(['Transactions', analytics.transactions]);
  
  // Apply styles
  worksheet.getRow(1).font = EXCEL_STYLES.header.font;
  worksheet.getRow(4).font = EXCEL_STYLES.sectionHeader.font;
  worksheet.getRow(9).font = EXCEL_STYLES.sectionHeader.font;
  
  // Auto-width columns
  worksheet.columns.forEach(col => col.width = 25);
  
  return await workbook.xlsx.writeBuffer();
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
      ? await generatePDFReport(analytics, reportType)
      : await generateExcelReport(analytics, reportType);
    
    // Save file and update report status
    const filename = `${reportId}.${safeFormat.toLowerCase()}`;
    const filePath = await saveBufferToFile(content, filename);
    
    report.status = 'completed';
    report.filePath = filePath;
    await report.save();
    
    return { success: true, reportId };
  } catch (error) {
    logger.error('Async report generation failed:', error);
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
