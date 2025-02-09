import React from 'react';
import './styles/transactionWalletCardStyles.css';

const TransactionWalletCard = ({ wallet, onSelect }) => {
    return (
        <div className="wallet-card" onClick={() => onSelect(wallet._id)}>
            <div className="wallet-card-header">
                <h3 className="wallet-name">{wallet.name}</h3>
                <div className="wallet-balance">${wallet.balance.toFixed(2)}</div>
            </div>
        </div>
    );
};

export default TransactionWalletCard;