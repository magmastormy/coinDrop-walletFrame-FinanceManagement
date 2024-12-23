// src/components/Budget/BudgetTransactionList.jsx 
import React from 'react';
import './styles/budgetStyles.css';
import TransactionCard from '../Transaction/TransactionCard';

const BudgetTransactionList = ({ transactions, budget }) => {
    const progress = {
        spent: transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0),
        remaining: budget.amount - transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0),
        percentage: (transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0) / budget.amount) * 100
    };

    return (
        <div className="budget-transactions">
            <div className="budget-progress-container">
                <div className="progress-bar">
                    <div 
                        className="progress-fill"
                        style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    />
                </div>
                <div className="progress-stats">
                    <span>Budget: ${budget.amount}</span>
                    <span>Spent: ${progress.spent}</span>
                    <span>Left: ${progress.remaining}</span>
                </div>
            </div>
            <div className="transactions-container">
                {transactions.map(transaction => (
                    <TransactionCard 
                        key={transaction._id}
                        transaction={transaction}
                    />
                ))}
            </div>
        </div>
    );
};

export default BudgetTransactionList;