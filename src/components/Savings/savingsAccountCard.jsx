import React from 'react';
import './styles/savingsCardStyles.css';

const SavingsAccountCard = ({ account }) => {
    return (
        <div className="savings-account-card">
            <h3>{account.name}</h3>
            <p>Balance: ${account.balance.toFixed(2)}</p>
            <p>Automation: {account.automation.type === 'fixed' ? `Fixed Amount: $${account.automation.amount}` : `Percentage: ${account.automation.percentage}%`}</p>
            <p>Frequency: {account.automation.frequency}</p>
        </div>
    );
};

export default SavingsAccountCard;