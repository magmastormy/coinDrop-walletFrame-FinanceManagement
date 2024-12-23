import React from 'react';
import './styles/budgetCard.css';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  return (
    <div className="budget-card">
      <h3>{budget.name}</h3>
      <div className="budget-details">
        <p>Category: {budget.category}</p>
        <p>Amount: {budget.amount}</p>
        <p>Type: {budget.type}</p>
      </div>
      <div className="budget-meta">
        <p>Status: {budget.status}</p>
        <p>Start Date: {new Date(budget.startDate).toLocaleDateString()}</p>
        <p>End Date: {new Date(budget.endDate).toLocaleDateString()}</p>
      </div>
      <div className="budget-actions">
        <button onClick={() => onEdit(budget)}>Edit</button>
        <button onClick={() => onDelete(budget._id)}>Delete</button>
      </div>
    </div>
  );
};

export default BudgetCard;