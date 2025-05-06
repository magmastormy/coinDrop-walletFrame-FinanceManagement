import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import BudgetTransactionList from './budgetTransactionList';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';

const BudgetAnalytics = ({ budget, transactions, filter, onFilterChange }) => {
  if (!budget) {
    return <Typography>Select a budget to view analytics</Typography>;
  }
  return (
    <Box>
      <BudgetTransactionList
        budget={budget}
        transactions={transactions}
        onFilterChange={onFilterChange}
        filter={filter}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <BudgetChart budget={budget} />
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <BudgetPerformanceChart budget={budget} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default BudgetAnalytics;
