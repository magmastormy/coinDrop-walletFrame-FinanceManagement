import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPiggyBank, 
    faEllipsisV, 
    faTrash, 
    faEdit, 
    faArrowRight,
    faMoneyBillTransfer
} from '@fortawesome/free-solid-svg-icons';
import './styles/savingsAccountCardStyles.css';

const SavingsAccountCard = ({ account, onTransfer, onSelect, onDeposit, onWithdraw, onEdit, onDelete }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    const handleOptionsToggle = (e) => {
        e.stopPropagation();
        setShowOptions(prev => !prev);
        setShowDeleteConfirm(false);
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(account._id);
            setShowOptions(false);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    return (
        <motion.div
            className="savings-account-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="savings-card-header">
                <div className="savings-icon-container">
                    <FontAwesomeIcon icon={faPiggyBank} className="savings-icon" />
                </div>
                <button 
                    className="options-btn"
                    onClick={handleOptionsToggle}
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>

                {showOptions && (
                    <div className="options-container">
                        <div className="options-menu">
                            <button 
                                className="option-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                    setShowOptions(false);
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                <span>Edit</span>
                            </button>
                            <button 
                                className="option-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTransfer();
                                    setShowOptions(false);
                                }}
                            >
                                <FontAwesomeIcon icon={faMoneyBillTransfer} />
                                <span>Transfer</span>
                            </button>
                            <button 
                                className="option-item danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>{showDeleteConfirm ? 'Confirm Delete' : 'Delete'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="savings-card-content">
                <h3 className="savings-name" title={account.name}>
                    {account.name}
                </h3>
                <div className="savings-balance-container">
                    <div className="savings-balance">
                        {formatBalance(account.balance)}
                    </div>
                    {account.automation && (
                        <div className="automation-info">
                            <FontAwesomeIcon icon={faArrowRight} />
                            <span>
                                {account.automation.type === 'fixed' 
                                    ? `${formatBalance(account.automation.amount)} ${account.automation.frequency}`
                                    : `${account.automation.percentage}% ${account.automation.frequency}`
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="savings-actions">
                <button 
                    className="action-btn deposit"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeposit();
                    }}
                >
                    Deposit
                </button>
                <button 
                    className="action-btn withdraw"
                    onClick={(e) => {
                        e.stopPropagation();
                        onWithdraw();
                    }}
                >
                    Withdraw
                </button>
            </div>
        </motion.div>
    );
};

export default SavingsAccountCard;
