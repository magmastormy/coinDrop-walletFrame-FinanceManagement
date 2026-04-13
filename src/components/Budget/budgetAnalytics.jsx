import { useLogger } from '../../hooks/useLogger.jsx';

import React from 'react';
import BudgetTransactionList from './budgetTransactionList';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';
import Card from '../ui/Card';

const BudgetAnalytics = ({ budget, transactions, filter, onFilterChange }) => {
  // Validate inputs
  if (!budget || typeof budget !== 'object') {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Invalid budget data provided
      </div>
    );
  }

  if (!Array.isArray(transactions)) {
    logWarn('BudgetAnalytics: transactions is not an array, using empty array');
    transactions = [];
  }

  return (
    <div className="space-y-6">
      <BudgetTransactionList
        budget={budget}
        transactions={transactions}
        onFilterChange={onFilterChange}
        filter={filter}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" elevation={1} className="p-4 h-full">
          <BudgetChart budget={budget} />
        </Card>
        <Card variant="default" elevation={1} className="p-4 h-full">
          <BudgetPerformanceChart budget={budget} />
        </Card>
      </div>
    </div>
  );
};

export default BudgetAnalytics;
