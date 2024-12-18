import React from 'react';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
    return (
        <div className="budget-card">
            <h3>{budget.name}</h3>
            <p>Category: {budget.category}</p>
            <p>Amount: {budget.amount}</p>
            <p>Type: {budget.type}</p>
            <p>Status: {budget.status}</p>
            <p>Start Date: {new Date(budget.startDate).toLocaleDateString()}</p>
            <p>End Date: {new Date(budget.endDate).toLocaleDateString()}</p>
            <button onClick={() => onEdit(budget)}>Edit</button>
            <button onClick={() => onDelete(budget._id)}>Delete</button>
        </div>
    );
};

export default BudgetCard;