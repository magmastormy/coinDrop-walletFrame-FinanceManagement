import React from 'react';
import './styles/transactionCardStyles.css';
const TransactionCard = ({ transaction, onEdit, onDelete }) => {
    return (
        <div className="transaction-card">
            <h3>{transaction.description || 'No Description'}</h3>
            <p>Amount: {transaction.amount}</p>
            <p>Type: {transaction.type}</p>
            <p>Date: {new Date(transaction.date).toLocaleDateString()}</p>
            <button onClick={() => onEdit(transaction)}>Edit</button>
            <button onClick={() => onDelete(transaction._id)}>Delete</button>
        </div>
    );
};

export default TransactionCard;