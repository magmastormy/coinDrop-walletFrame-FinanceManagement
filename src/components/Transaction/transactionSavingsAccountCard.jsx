import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/transactionSavingsAccountCardStyles.css';

const TransactionSavingsAccountCard = ({ savingsAccount, onSelect, selectedId }) => {
    const { theme } = useTheme();
    const isSelected = selectedId === savingsAccount._id;

    return (
        <motion.div
            className={`transaction-savings-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(savingsAccount._id)}
            whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            style={{
                backgroundColor: isSelected ? theme.background.primary : theme.background.secondary,
                borderColor: isSelected ? theme.button.base : 'transparent'
            }}
        >
            <div className="savings-icon">
                <FontAwesomeIcon 
                    icon={faPiggyBank} 
                    style={{ color: theme.button.base }}
                />
            </div>
            <div className="savings-info">
                <h3 style={{ color: theme.text.primary }}>{savingsAccount.name}</h3>
                <p 
                    className="savings-balance"
                    style={{ color: theme.text.secondary }}
                >
                    ${savingsAccount.balance.toFixed(2)}
                </p>
            </div>
        </motion.div>
    );
};

export default TransactionSavingsAccountCard;
