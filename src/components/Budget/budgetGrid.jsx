import React from 'react';
import PropTypes from 'prop-types';
import BudgetCard from './budgetCard';

const BudgetGrid = ({ budgets = [], onEdit, onDelete, onSelect, selectedBudget, wallets }) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 2xl:grid-cols-3 items-stretch">
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
);

BudgetGrid.propTypes = {
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  selectedBudget: PropTypes.shape({
    _id: PropTypes.string
  }),
  wallets: PropTypes.array
};

export default React.memo(BudgetGrid);
