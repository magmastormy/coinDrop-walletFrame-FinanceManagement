import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import './styles/savingsCardStyles.css';

const SavingsCard = ({ account, onTransfer }) => {
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
            className="savings-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="savings-card-header">
                <div className="savings-icon">
                    <FontAwesomeIcon icon={faPiggyBank} size="2x" />
                </div>
                <div className="savings-info">
                    <h3>Savings Balance</h3>
                    <p className="savings-balance">{formatBalance(account.balance)}</p>
                </div>
            </div>

            <div className="savings-card-content">
                {account.automaticSavings && (
                    <div className="automatic-savings-info">
                        <h4>Automatic Savings</h4>
                        <p>
                            {account.automaticSavings.type === 'amount' 
                                ? `${formatBalance(account.automaticSavings.value)} monthly`
                                : `${account.automaticSavings.value}% of income`
                            }
                        </p>
                    </div>
                )}
            </div>

            <div className="savings-card-actions">
                <button
                    className="transfer-button"
                    onClick={onTransfer}
                    aria-label="Transfer to/from savings"
                >
                    <FontAwesomeIcon icon={faExchangeAlt} />
                    <span>Transfer</span>
                </button>
            </div>
        </motion.div>
    );
};

export default SavingsCard;
