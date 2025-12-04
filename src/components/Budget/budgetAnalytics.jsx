import React from 'react';
import BudgetTransactionList from './budgetTransactionList';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';

const BudgetAnalytics = ({ budget, transactions, filter, onFilterChange }) => {
  if (!budget) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Select a budget to view analytics
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <BudgetTransactionList
        budget={budget}
        transactions={transactions}
        onFilterChange={onFilterChange}
        filter={filter}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <BudgetChart budget={budget} />
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <BudgetPerformanceChart budget={budget} />
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;
