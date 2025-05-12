import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
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
  })
};

export default BudgetGrid;
