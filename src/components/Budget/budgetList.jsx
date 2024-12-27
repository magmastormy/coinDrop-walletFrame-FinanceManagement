import React from 'react';
import './styles/budgetListStyles.css';
import BudgetCard from './budgetCard';

const BudgetList = ({ budgets, onEdit, onDelete }) => {
    return (
        <div className="budget-list">
            {budgets.map(budget => (
                <BudgetCard
                    key={budget._id}
                    budget={budget}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default BudgetList;