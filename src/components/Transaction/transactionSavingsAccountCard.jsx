import React from 'react';
import './styles/transactionSavingsAccountCardStyles.css';

const TransactionSavingsAccountCard = ({ savingsAccount, onSelect }) => {
    return (
        <div className="savings-account-card" onClick={() => onSelect(savingsAccount._id)}>
            <div className="savings-account-card-header">
                <h3 className="savings-account-name">{savingsAccount.name}</h3>
                <div className="savings-account-balance">${savingsAccount.balance.toFixed(2)}</div>
            </div>
        </div>
    );
};

export default TransactionSavingsAccountCard;
