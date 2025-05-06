import React from 'react';
import { Grid } from '@mui/material';
import BudgetCard from './budgetCard';

const BudgetGrid = ({ budgets = [], onEdit, onDelete, onSelect, selectedBudget }) => (
  <Grid container spacing={2}>
    {budgets.map(b => (
      <Grid key={b._id} item xs={12} sm={6} md={4}>
        <BudgetCard
          budget={b}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          isSelected={selectedBudget?._id === b._id}
        />
      </Grid>
    ))}
  </Grid>
);

export default BudgetGrid;
