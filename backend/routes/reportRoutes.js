const logger = require('../utils/logger');

const express = require('express');
const router = express.Router();
const { getReportFromStorage } = require('../utils/reportGenerator');
const { authMiddleware } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const ReportController = require('../controllers/reportController');
const { readFileToBuffer } = require('../utils/fileUtils');
const PDFDocument = require('pdfkit');
const { getAuthenticatedUserId } = require('../utils/authUser');

const getGlobalReportData = async (userId) => {
  // Implementation to get global report data
  return { userId, global: true };
};

const getAccountReportData = async (accountId) => {
  // Implementation to get account-specific report data
  return { accountId, global: false };
};

/**
 * Get available report types
 */
router.get('/types', async (req, res) => {
  try {
    const reportTypes = [
      { 
        id: 'financial-summary', 
        name: 'Financial Summary',
        formats: ['PDF', 'EXCEL']
      },
      { 
        id: 'budget-analysis', 
        name: 'Budget Analysis',
        formats: ['PDF', 'EXCEL'] 
      },
      { 
        id: 'savings-report', 
        name: 'Savings Report',
        formats: ['PDF', 'EXCEL']
      }
    ];
    
    res.json(reportTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate a new report
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    await ReportController.generateReport(req, res);
  } catch (error) {
    logger.error('Report route error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get report status
 */
router.get('/:reportId/status', authMiddleware, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const report = await Report.findOne({ _id: req.params.reportId, userId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ status: report.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get report status' });
  }
});

/**
 * Download a report
 */
router.get('/:reportId/download', authMiddleware, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const report = await Report.findOne({ _id: req.params.reportId, userId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get report content
    let content;
    
    if (report.filePath) {
      content = await readFileToBuffer(report.filePath);
    }
    
    if (!content) {
      return res.status(404).json({ error: 'Report file not found' });
    }
    
    // Set appropriate headers
    const contentType = report.format === 'PDF' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const extension = report.format.toLowerCase();
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', content.length);
    res.setHeader('Content-Disposition', `attachment; filename=report-${report.type}.${extension}`);
    
    // Send file
    return res.send(content);
  } catch (error) {
    logger.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report', details: error.message });
  }
});

router.get('/simple-pdf', authMiddleware, async (req, res) => {
  res.status(410).json({
    error: 'Deprecated route',
    message: 'simple-pdf test route is disabled in secured environments'
  });
});

module.exports = router; 
