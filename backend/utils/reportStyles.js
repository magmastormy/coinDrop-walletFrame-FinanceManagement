/**
 * Centralized styling for reports
 */
const PDF_STYLES = {
  header: {
    fontSize: 20,
    align: 'center'
  },
  subheader: {
    fontSize: 16,
    align: 'center'
  },
  section: {
    fontSize: 14,
    underline: true
  },
  normal: {
    fontSize: 12
  }
};

const EXCEL_STYLES = {
  header: {
    font: { bold: true, size: 14 },
    alignment: { horizontal: 'center' }
  },
  subheader: {
    font: { bold: true, size: 12 },
    alignment: { horizontal: 'center' }
  },
  tableHeader: {
    font: { bold: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
  }
};

const EXCEL_COLUMNS = {
  'financial-summary': [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 15 }
  ],
  'budget-analysis': [
    { header: 'Category', key: 'category', width: 30 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: 'Spent', key: 'spent', width: 15 },
    { header: 'Remaining', key: 'remaining', width: 15 },
    { header: '% Used', key: 'percentUsed', width: 15 }
  ],
  'savings-report': [
    { header: 'Month', key: 'month', width: 15 },
    { header: 'Income', key: 'income', width: 15 },
    { header: 'Expenses', key: 'expenses', width: 15 },
    { header: 'Savings', key: 'savings', width: 15 }
  ]
};

module.exports = {
  PDF_STYLES,
  EXCEL_STYLES,
  EXCEL_COLUMNS
}; 