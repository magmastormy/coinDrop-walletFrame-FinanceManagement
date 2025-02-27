const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');
const Report = require('../models/Report');
const { format } = require('@fast-csv/format');
const D3Node = require('d3-node');

class ReportController {
    static async generateReport(req, res) {
        try {
            const userId = req.user._id;
            const { reportType, format } = req.body;

            // Fetch all necessary data
            const [transactions, wallets, budgets] = await Promise.all([
                Transaction.find({ userId }),
                Wallet.find({ userId }),
                Budget.find({ userId })
            ]);

            // Calculate analytics similar to dashboardUserShortAnalytics
            const analytics = await this.calculateAnalytics(transactions, wallets, budgets);

            // Generate report based on format
            let reportContent;
            if (format.toUpperCase() === 'PDF') {
                reportContent = await this.generatePDFReport(analytics, reportType);
            } else if (format.toUpperCase() === 'EXCEL') {
                reportContent = await this.generateExcelReport(analytics, reportType);
            }

            // Store report metadata
            const report = await this.saveReportMetadata(userId, reportType, format);

            res.json({
                reportId: report._id,
                status: 'success',
                message: 'Report generated successfully'
            });
        } catch (error) {
            console.error('Report generation error:', error);
            res.status(500).json({ error: 'Failed to generate report' });
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
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        
        // Header
        doc.fontSize(20).text('Financial Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Content based on report type
        switch (reportType) {
            case 'financial-summary':
                // Create table for financial summary
                const tableData = {
                    headers: ['Metric', 'Value'],
                    rows: [
                        ['Total Balance', `$${analytics.totalBalance.toFixed(2)}`],
                        ['Monthly Income', `$${analytics.monthlyIncome.toFixed(2)}`],
                        ['Monthly Expenses', `$${analytics.monthlyExpenses.toFixed(2)}`],
                        ['Savings Rate', `${analytics.savingsRate.toFixed(1)}%`]
                    ]
                };

                await doc.table(tableData, {
                    prepareHeader: () => doc.font('Helvetica-Bold'),
                    prepareRow: () => doc.font('Helvetica')
                });

                // Add SVG chart
                if (analytics.monthlyTrends) {
                    const svgString = await this.generateSVGChart({
                        labels: analytics.monthlyTrends.map(t => t.month),
                        values: analytics.monthlyTrends.map(t => t.amount)
                    });
                    
                    doc.addPage();
                    doc.svg(svgString, {
                        fit: [500, 400],
                        align: 'center'
                    });
                }
                break;

            case 'savings-report':
                // Reference analytics route pattern from:
                // backend/routes/analyticsRoutes.js lines 95-135
                doc.fontSize(16).text('Savings Analysis');
                doc.moveDown();
                doc.text(`Current Savings Rate: ${analytics.savingsRate.toFixed(1)}%`);
                doc.text(`Monthly Savings: $${(analytics.monthlyIncome - analytics.monthlyExpenses).toFixed(2)}`);
                
                if (analytics.recommendations) {
                    doc.moveDown();
                    doc.fontSize(14).text('Recommendations:');
                    analytics.recommendations.forEach(rec => {
                        doc.text(`• ${rec}`);
                    });
                }
                break;

            case 'budget-performance':
                // Reference budget performance pattern from:
                // backend/controllers/budgetController.js lines 229-268
                doc.fontSize(16).text('Budget Performance');
                doc.moveDown();
                if (analytics.budgetPerformance) {
                    analytics.budgetPerformance.forEach(budget => {
                        doc.text(`${budget.name}: ${budget.spentPercentage}% used`);
                    });
                }
                break;
        }

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });
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