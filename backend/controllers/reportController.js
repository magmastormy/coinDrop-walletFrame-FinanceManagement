const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');
const Report = require('../models/Report');
const { format } = require('@fast-csv/format');
const D3Node = require('d3-node');
const path = require('path');
const fs = require('fs').promises;

class ReportController {
    static async generateReport(req, res) {
        try {
            const userId =  req.user._id || req.query.userId || req.user.userId;
            const { reportType, format } = req.body;
            
            console.log('Generating report:', { userId, reportType, format });

            // Validate input
            if (!reportType || !format) {
                return res.status(400).json({ error: 'Report type and format are required' });
            }

            try {
                // Fetch all necessary data
                const [transactions, wallets, budgets] = await Promise.all([
                    Transaction.find({ userId }),
                    Wallet.find({ userId }),
                    Budget.find({ userId })
                ]);

                console.log('Data fetched:', { 
                    transactionsCount: transactions.length,
                    walletsCount: wallets.length,
                    budgetsCount: budgets.length
                });

                // Calculate analytics
                const analytics = await this.calculateAnalytics(transactions, wallets, budgets);
                
                // Create a new report record
                const report = new Report({
                    userId,
                    type: reportType,
                    format: format.toUpperCase(),
                    status: 'processing',
                    generatedAt: new Date()
                });
                
                await report.save();
                
                // Generate report content
                let reportContent;
                try {
                    if (format.toUpperCase() === 'PDF') {
                        reportContent = await this.generatePDFReport(analytics, reportType);
                    } else if (format.toUpperCase() === 'EXCEL') {
                        reportContent = await this.generateExcelReport(analytics, reportType);
                    } else {
                        return res.status(400).json({ error: 'Invalid format. Supported formats: PDF, EXCEL' });
                    }
                    
                    // Create reports directory if it doesn't exist
                    const REPORTS_DIR = path.join(__dirname, '../reports');
                    await fs.mkdir(REPORTS_DIR, { recursive: true });
                    
                    // Save the file
                    const filePath = path.join(REPORTS_DIR, `${report._id}.${format.toLowerCase()}`);
                    await fs.writeFile(filePath, reportContent);
                    
                    // Update the report with the file path and status
                    report.filePath = filePath;
                    report.status = 'completed';
                    await report.save();
                    
                    res.json({
                        reportId: report._id,
                        status: 'success',
                        message: 'Report generated successfully'
                    });
                } catch (genError) {
                    console.error('Report generation error:', genError);
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

    static async calculateAnalytics(transactions, wallets, budgets) {
        // Similar calculation logic as in dashboardUserShortAnalytics
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

    static async generatePDFReport(analytics, reportType) {
        console.log('Starting PDF generation for', reportType, 'with analytics:', analytics);
        
        try {
            // Create a new PDF document
            const doc = new PDFDocument();
            const buffers = [];
            
            // Collect PDF data chunks
            doc.on('data', (chunk) => {
                console.log('PDF chunk received, size:', chunk.length);
                buffers.push(chunk);
            });
            
            // Add content to the PDF
            console.log('Adding content to PDF');
            
            // Header
            doc.fontSize(20).text('Financial Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
            doc.moveDown();
            
            // Add report type
            doc.fontSize(16).text(`Report Type: ${reportType}`, { align: 'center' });
            doc.moveDown();
            
            // Basic content that doesn't rely on complex data
            doc.fontSize(14).text('Financial Overview', { underline: true });
            doc.moveDown();
            
            // Simple table with basic data
            doc.fontSize(12).text(`Total Balance: $${analytics.totalBalance?.toFixed(2) || '0.00'}`);
            doc.text(`Monthly Income: $${analytics.monthlyIncome?.toFixed(2) || '0.00'}`);
            doc.text(`Monthly Expenses: $${analytics.monthlyExpenses?.toFixed(2) || '0.00'}`);
            doc.text(`Savings Rate: ${analytics.savingsRate?.toFixed(1) || '0'}%`);
            
            // Finalize the PDF
            console.log('Finalizing PDF document');
            doc.end();
            
            // Return a promise that resolves when the document is complete
            return new Promise((resolve, reject) => {
                // Handle errors
                doc.on('error', (err) => {
                    console.error('PDF generation error:', err);
                    reject(err);
                });
                
                // Resolve when document is complete
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    console.log('PDF generation complete, size:', pdfBuffer.length, 'bytes');
                    resolve(pdfBuffer);
                });
            });
        } catch (error) {
            console.error('Error in PDF generation:', error);
            throw error;
        }
    }

    static async generateExcelReport(analytics, reportType) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');

        // Common styling
        worksheet.getColumn(1).width = 30;
        worksheet.getColumn(2).width = 15;

        // Header
        worksheet.addRow(['Financial Report']);
        worksheet.addRow(['Generated on:', new Date().toLocaleDateString()]);
        worksheet.addRow([]);

        switch (reportType) {
            case 'financial-summary':
                worksheet.addRow(['Financial Overview']);
                worksheet.addRow(['Total Balance', analytics.totalBalance]);
                worksheet.addRow(['Monthly Income', analytics.monthlyIncome]);
                worksheet.addRow(['Monthly Expenses', analytics.monthlyExpenses]);
                worksheet.addRow(['Savings Rate', `${analytics.savingsRate}%`]);
                break;

            case 'savings-report':
                // Reference analytics calculation pattern from:
                // backend/controllers/analyticsController.js lines 211-273
                worksheet.addRow(['Savings Analysis']);
                worksheet.addRow(['Current Savings Rate', `${analytics.savingsRate}%`]);
                worksheet.addRow(['Monthly Savings', analytics.monthlyIncome - analytics.monthlyExpenses]);
                
                if (analytics.monthlyTrends) {
                    worksheet.addRow([]);
                    worksheet.addRow(['Month', 'Income', 'Expenses', 'Savings']);
                    analytics.monthlyTrends.forEach(trend => {
                        worksheet.addRow([
                            trend.month,
                            trend.income,
                            trend.expenses,
                            trend.income - trend.expenses
                        ]);
                    });
                }
                break;

            case 'budget-performance':
                worksheet.addRow(['Budget Performance']);
                if (analytics.budgetPerformance) {
                    worksheet.addRow(['Category', 'Budget', 'Spent', 'Remaining', '% Used']);
                    analytics.budgetPerformance.forEach(budget => {
                        worksheet.addRow([
                            budget.name,
                            budget.amount,
                            budget.spent,
                            budget.amount - budget.spent,
                            `${budget.spentPercentage}%`
                        ]);
                    });
                }
                break;
        }

        return workbook.xlsx.writeBuffer();
    }

    static async saveReportMetadata(userId, type, format) {
        const report = new Report({
            userId,
            type,
            format,
            status: 'processing',
            generatedAt: new Date()
        });
        
        await report.save();
        return report;
    }
}

module.exports = ReportController; 