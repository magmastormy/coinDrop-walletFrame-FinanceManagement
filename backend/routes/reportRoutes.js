const express = require('express');
const router = express.Router();
const { getReportFromStorage } = require('../utils/reportGenerator');
const { authMiddleware } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const ReportController = require('../controllers/reportController');
const fs = require('fs').promises;
const path = require('path');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

const getGlobalReportData = async (userId) => {
  // Implementation to get global report data
  return { userId, global: true };
};

const getAccountReportData = async (accountId) => {
  // Implementation to get account-specific report data
  return { accountId, global: false };
};

// Simple route to get report types
router.get('/types', async (req, res) => {
  try {
    // Based on your Report model's enum values
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

// Use authMiddleware instead of authenticateUser
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    console.log('Report generation request received:', req.body);
    
    // Simple validation
    const { format, reportType } = req.body;
    if (!format || !reportType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call controller
    await ReportController.generateReport(req, res);
  } catch (error) {
    console.error('Report route error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/:reportId', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const reportData = await getReportFromStorage(report._id);
    if (!reportData) {
      return res.status(404).json({ error: 'Report file not found' });
    }
    
    res.setHeader('Content-Type', report.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report.${report.format.toLowerCase()}`);
    res.send(reportData.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This route should come AFTER specific routes but BEFORE other parameter routes
router.get('/:reportId/download', authMiddleware, async (req, res) => {
  try {
    console.log('Download request for report:', req.params.reportId);
    
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      console.log('Report not found:', req.params.reportId);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    console.log('Report found:', report);
    
    // Check if the report has a filePath
    if (!report.filePath) {
      console.log('Report has no filePath:', report._id);
      
      // If the report is marked as completed but has no file, generate it now
      if (report.status === 'completed') {
        console.log('Generating report file on-demand');
        
        // Get data needed for report generation
        const userId = report.userId;
        const [transactions, wallets, budgets] = await Promise.all([
          Transaction.find({ userId }),
          Wallet.find({ userId }),
          Budget.find({ userId })
        ]);
        
        const analytics = await ReportController.calculateAnalytics(
          transactions, wallets, budgets
        );
        
        // Generate report content
        const content = report.format === 'PDF' 
          ? await ReportController.generatePDFReport(analytics, report.type)
          : await ReportController.generateExcelReport(analytics, report.type);
        
        // Create reports directory if it doesn't exist
        const REPORTS_DIR = path.join(__dirname, '../reports');
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        
        // Save the file
        const filePath = path.join(REPORTS_DIR, `${report._id}.${report.format.toLowerCase()}`);
        await fs.writeFile(filePath, content);
        
        // Update the report with the file path
        report.filePath = filePath;
        await report.save();
        
        // Send the file
        res.setHeader('Content-Type', report.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report-${report.type}.${report.format.toLowerCase()}`);
        return res.send(content);
      }
      
      return res.status(404).json({ error: 'Report file not found' });
    }
    
    // Try to read the file
    try {
      const content = await fs.readFile(report.filePath);
      
      // Set the correct content type
      const contentType = report.format === 'PDF' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      console.log(`Sending file: ${report.filePath}, size: ${content.length}, type: ${contentType}`);
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', content.length);
      res.setHeader('Content-Disposition', `attachment; filename=report-${report.type}.${report.format.toLowerCase()}`);
      
      // Send the file as a binary response
      return res.send(content);
    } catch (fileError) {
      console.error('Error reading report file:', fileError);
      return res.status(404).json({ error: 'Report file could not be read' });
    }
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report', details: error.message });
  }
});

// Use authMiddleware instead of authenticateUser
router.get('/:reportId/status', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ status: report.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get report status' });
  }
});

module.exports = router; 