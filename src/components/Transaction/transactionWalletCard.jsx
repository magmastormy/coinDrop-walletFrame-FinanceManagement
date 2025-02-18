import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/transactionWalletCardStyles.css';

const TransactionWalletCard = ({ wallet, isSelected, onClick }) => {
    const { theme } = useTheme();

    return (
        <motion.div
            className={`transaction-wallet-card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            style={{
                backgroundColor: isSelected ? theme.background.primary : theme.background.secondary,
                borderColor: isSelected ? theme.button.base : 'transparent'
            }}
        >
            <div className="wallet-icon">
                <FontAwesomeIcon 
                    icon={faWallet} 
                    style={{ color: theme.button.base }}
                />
            </div>
            <div className="wallet-info">
                <h3 style={{ color: theme.text.primary }}>{wallet.name}</h3>
                <p 
                    className="wallet-balance"
                    style={{ color: theme.text.secondary }}
                >
                    ${wallet.balance.toFixed(2)}
                </p>
            </div>
        </motion.div>
    );
};

export default TransactionWalletCard;