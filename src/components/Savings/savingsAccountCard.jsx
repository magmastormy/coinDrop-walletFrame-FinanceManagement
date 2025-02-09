import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import './styles/savingsManagerStyles.css';

const SavingsCard = ({ account, onTransfer, onSelect }) => {
    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    return (
        <motion.div
            className="savings-account-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => onSelect(account._id)}
        >
            <div className="savings-card-header">
                <div className="savings-icon">
                    <FontAwesomeIcon icon={faPiggyBank} size="2x" />
                </div>
                <div className="savings-info">
                    <h3>{account.name}</h3>
                    <p className="savings-balance">{formatBalance(account.balance)}</p>
                </div>
            </div>

            <div className="savings-card-content">
                {account.automation && (
                    <div className="automatic-savings-info">
                        <h4>Automation Settings</h4>
                        <p>
                            {account.automation.type === 'fixed' 
                                ? `${formatBalance(account.automation.amount)} ${account.automation.frequency}`
                                : `${account.automation.percentage}% of income ${account.automation.frequency}`
                            }
                        </p>
                    </div>
                )}
                <div className="savings-actions">
                    <button className="deposit-button">Deposit</button>
                    <button className="withdraw-button">Withdraw</button>
                    <button 
                        className="transfer-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTransfer();
                        }}
                    >
                        Transfer Funds
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default SavingsCard;
