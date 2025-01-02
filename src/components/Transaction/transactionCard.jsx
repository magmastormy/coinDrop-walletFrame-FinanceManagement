import React from 'react';
import './styles/transactionCardStyles.css';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
    const formatAmount = (amount, type) => {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
        return type === 'expense' ? `-${formattedAmount}` : formattedAmount;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDelete(transaction._id);
        }
    };

    return (
        <div 
            className={`transaction-card ${transaction.type}`}
            role="article"
            aria-label={`Transaction: ${transaction.description || 'No Description'}`}
        >
            <div className="transaction-card-header">
                <h3 className="transaction-title">
                    {transaction.description || 'No Description'}
                </h3>
                <div className={`transaction-type-badge ${transaction.type}`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </div>
            </div>
            
            <div className="transaction-details">
                <div className="transaction-amount">
                    {formatAmount(transaction.amount, transaction.type)}
                </div>
                <div className="transaction-date">
                    {formatDate(transaction.date)}
                </div>
            </div>

            <div className="transaction-card-actions">
                <button 
                    className="action-btn edit"
                    onClick={() => onEdit(transaction)}
                    aria-label={`Edit transaction: ${transaction.description || 'No Description'}`}
                >
                    <span className="action-icon">✎</span>
                    <span className="action-text">Edit</span>
                </button>
                <button 
                    className="action-btn delete"
                    onClick={handleDelete}
                    aria-label={`Delete transaction: ${transaction.description || 'No Description'}`}
                >
                    <span className="action-icon">×</span>
                    <span className="action-text">Delete</span>
                </button>
            </div>
        </div>
    );
};

export default TransactionCard;