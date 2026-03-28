import React from 'react';
import PropTypes from 'prop-types';
import BudgetCard from './budgetCard';

const BudgetGrid = React.memo(({ budgets = [], onEdit, onDelete, onSelect, selectedBudget, wallets }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
    {budgets.map(b => (
      <BudgetCard
        key={b._id}
        budget={b}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
        isSelected={selectedBudget?._id === b._id}
        wallets={wallets}
      />
    ))}
  </div>
));

BudgetGrid.displayName = 'BudgetGrid';

export default React.memo(BudgetGrid);
