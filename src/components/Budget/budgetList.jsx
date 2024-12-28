import React from 'react';
import './styles/budgetListStyles.css';
import BudgetCard from './budgetCard';

const BudgetList = ({ budgets = [], onEdit, onDelete }) => {
    if (!Array.isArray(budgets)) {
        console.warn('BudgetList: budgets prop is not an array');
        return null;
    }

    if (budgets.length === 0) {
        return <div className="empty-state">No budgets available</div>;
    }
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