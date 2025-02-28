const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Report = require('../models/Report');
const { format } = require('@fast-csv/format');
const D3Node = require('d3-node');
const path = require('path');
const fs = require('fs').promises;
const { PDF_STYLES, EXCEL_STYLES, EXCEL_COLUMNS } = require('../utils/reportStyles');
const { storeReportMetadata, generateReportAsync } = require('../utils/reportGenerator');
const { saveBufferToFile } = require('../utils/fileUtils');

class ReportController {
    /**
     * Main report generation handler
     */
    static async generateReport(req, res) {
        try {
            console.log('Report generation request received:', req.body);
            const userId = req.user._id || req.user.userId;
            const { reportType, format } = req.body;
            
            console.log('Generating report for user:', userId);
            console.log('Report type:', reportType);
            console.log('Format:', format);
            
            // Validate input
            if (!reportType || !format) {
                return res.status(400).json({ error: 'Report type and format are required' });
            }
            
            try {
                // Create a new report record
                const report = new Report({
                    userId,
                    type: reportType,
                    format: format.toUpperCase(),
                    status: 'processing',
                    generatedAt: new Date()
                });
                
                await report.save();
                console.log('Report record created:', report._id);
                
                // Fetch data
                console.log('Fetching data for report...');
                const [transactions, wallets, budgets] = await Promise.all([
                    Transaction.find({ userId }),
                    Wallet.find({ userId }),
                    Budget.find({ userId })
                ]);
                
                console.log(`Data fetched: ${transactions.length} transactions, ${wallets.length} wallets, ${budgets.length} budgets`);
                
                // Calculate analytics
                const analytics = await this.calculateAnalytics(transactions, wallets, budgets);
                
                console.log('Analytics calculated:', analytics);
                
                // Generate report content
                let reportContent;
                try {
                    if (format.toUpperCase() === 'PDF') {
                        console.log('Generating PDF report...');
                        reportContent = await this.generatePDFReport(analytics, reportType);
                    } else {
                        console.log('Generating Excel report...');
                        reportContent = await this.generateExcelReport(analytics, reportType);
                    }
                    
                    console.log(`Report content generated, size: ${reportContent.length} bytes`);
                    
                    // Create reports directory if it doesn't exist
                    const REPORTS_DIR = path.join(__dirname, '../reports');
                    await fs.mkdir(REPORTS_DIR, { recursive: true });
                    
                    // Save the file
                    const filePath = path.join(REPORTS_DIR, `${report._id}.${format.toLowerCase()}`);
                    await fs.writeFile(filePath, reportContent);
                    
                    console.log(`Report saved to: ${filePath}`);
                    
                    // Update the report with the file path and status
                    report.filePath = filePath;
                    report.status = 'completed';
                    await report.save();
                    
                    console.log('Report record updated, status: completed');
                    
                    return res.json({
                        reportId: report._id,
                        status: 'success',
                        message: 'Report generated successfully'
                    });
                } catch (genError) {
                    console.error('Report content generation error:', genError);
                    report.status = 'failed';
                    await report.save();
                    return res.status(500).json({ error: 'Failed to generate report content', details: genError.message });
                }
            } catch (dbError) {
                console.error('Database operation error:', dbError);
                return res.status(500).json({ error: 'Database operation failed', details: dbError.message });
            }
        } catch (error) {
            console.error('Report generation error:', error);
            res.status(500).json({ error: 'Failed to generate report', details: error.message });
        }
    }
    
    /**
     * Start async report generation process
     */
    static async startReportGeneration(reportId, userId, reportType, format) {
        try {
            // Fetch all necessary data
            const [transactions, wallets, budgets] = await Promise.all([
                Transaction.find({ userId }),
                Wallet.find({ userId }),
                Budget.find({ userId })
            ]);
            
            // Calculate analytics
            const analytics = await this.calculateAnalytics(transactions, wallets, budgets);
            
            // Generate report asynchronously
            await generateReportAsync(reportId, analytics, reportType, format);
        } catch (error) {
            console.error('Report generation process error:', error);
            const report = await Report.findById(reportId);
            if (report) {
                report.status = 'failed';
                report.error = error.message;
                await report.save();
            }
        }
    }
    
    /**
     * Calculate analytics from user data
     */
    static async calculateAnalytics(transactions, wallets, budgets) {
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const currentMonth = new Date().getMonth();
        
        const currentMonthTransactions = transactions.filter(t => {
            const transactionMonth = new Date(t.date).getMonth();
            return transactionMonth === currentMonth;
        });

        const monthlyExpenses = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const monthlyIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            totalBalance,
            monthlyExpenses,
            monthlyIncome,
            savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0,
            wallets: wallets.length,
            budgets: budgets.length,
            transactions: transactions.length
        };
    }
    
    /**
     * Generate PDF report
     */
    static async generatePDFReport(analytics, reportType) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];
                
                // Collect PDF data chunks
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
                doc.moveDown();
                
                // Add financial data
                doc.fontSize(PDF_STYLES.normal.fontSize);
                doc.text(`Total Balance: $${analytics.totalBalance?.toFixed(2) ?? '0.00'}`);
                doc.text(`Monthly Income: $${analytics.monthlyIncome?.toFixed(2) ?? '0.00'}`);
                doc.text(`Monthly Expenses: $${analytics.monthlyExpenses?.toFixed(2) ?? '0.00'}`);
                doc.text(`Savings Rate: ${analytics.savingsRate?.toFixed(1) ?? '0'}%`);
                
                // Finalize PDF
                doc.end();
                
                // Return buffer when complete
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
    static async generateExcelReport(analytics, reportType) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');
        
        // Set columns based on report type
        worksheet.columns = EXCEL_COLUMNS[reportType] || EXCEL_COLUMNS['financial-summary'];
        
        // Add header
        const headerRow = worksheet.addRow(['Financial Report']);
        headerRow.font = EXCEL_STYLES.header.font;
        headerRow.alignment = EXCEL_STYLES.header.alignment;
        
        // Add date
        worksheet.addRow(['Generated on:', new Date().toLocaleDateString()]);
        worksheet.addRow([]);
        
        // Add content based on report type
        const subheaderRow = worksheet.addRow([`${reportType.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`]);
        subheaderRow.font = EXCEL_STYLES.subheader.font;
        
        worksheet.addRow([]);
        
        // Add data rows
        if (reportType === 'financial-summary') {
            worksheet.addRow(['Total Balance', `$${analytics.totalBalance?.toFixed(2) ?? '0.00'}`]);
            worksheet.addRow(['Monthly Income', `$${analytics.monthlyIncome?.toFixed(2) ?? '0.00'}`]);
            worksheet.addRow(['Monthly Expenses', `$${analytics.monthlyExpenses?.toFixed(2) ?? '0.00'}`]);
            worksheet.addRow(['Savings Rate', `${analytics.savingsRate?.toFixed(1) ?? '0'}%`]);
        }
        
        return workbook.xlsx.writeBuffer();
    }

    static async generateSVGChart(data, type = 'bar') {
        const d3n = new D3Node();
        const d3 = d3n.d3;
        
        // Set dimensions
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        
        // Create SVG
        const svg = d3n.createSVG(width, height);
        
        // Reference the chart styling from your frontend components
        // See: src/components/Budget/budgetCharts.jsx lines 51-54
        const colors = data.labels.map((_, index) => {
            const hue = (index * 137.5) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        });

        if (type === 'bar') {
            // Create bar chart using similar styling to:
            // src/components/Dashboard/dashboardBarChart.jsx lines 84-97
            const x = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .padding(0.1);

            const y = d3.scaleLinear()
                .range([height - margin.bottom, margin.top]);

            x.domain(data.labels);
            y.domain([0, d3.max(data.values)]);

            // Add bars
            svg.selectAll('rect')
                .data(data.values)
                .enter()
                .append('rect')
                .attr('x', (d, i) => x(data.labels[i]))
                .attr('y', d => y(d))
                .attr('width', x.bandwidth())
                .attr('height', d => height - margin.bottom - y(d))
                .attr('fill', (d, i) => colors[i]);
        }

        return d3n.svgString();
    }
}

module.exports = ReportController; 