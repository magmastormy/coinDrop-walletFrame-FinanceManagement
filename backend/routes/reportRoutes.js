const express = require('express');
const router = express.Router();
const { generatePDF, generateCSV } = require('../utils/reportGenerators');
const { authenticateUser } = require('../middleware/auth');
const { getReportFromStorage } = require('../utils/reportGenerator');
const Report = require('../models/Report');

router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { accountId, isGlobal, format, reportType } = req.body;
    
    // Get relevant data based on report type
    let reportData;
    if (isGlobal) {
      reportData = await getGlobalReportData(req.user.id);
    } else {
      reportData = await getAccountReportData(accountId);
    }

    // Generate report ID and store report metadata
    const reportId = await createReportRecord({
      userId: req.user.id,
      type: reportType,
      format,
      timestamp: new Date()
    });

    // Queue report generation
    await queueReportGeneration(reportId, reportData, format);

    res.json({ reportId, status: 'queued' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/:reportId', authenticateUser, async (req, res) => {
  try {
    const report = await getReportById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const fileBuffer = await getReportFile(report.filePath);
    
    res.setHeader('Content-Type', `application/${report.format.toLowerCase()}`);
    res.setHeader('Content-Disposition', `attachment; filename=report.${report.format.toLowerCase()}`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:reportId/status', authenticateUser, async (req, res) => {
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

router.get('/:reportId/download', authenticateUser, async (req, res) => {
    try {
        const report = await getReportFromStorage(req.params.reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found or not ready' });
        }

        res.setHeader('Content-Type', report.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report.${report.format.toLowerCase()}`);
        res.send(report.content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to download report' });
    }
});

module.exports = router; 