import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEllipsisV, 
    faTrash, 
    faEdit, 
    faArrowRight, 
    faWallet,
    faMoneyBillWave,
    faCreditCard,
    faUniversity,
    faPiggyBank
} from '@fortawesome/free-solid-svg-icons';
import EditWalletModal from './editWallet';
import WalletTransfer from './walletTransfer';
import './styles/walletCardStyles.css';

const WalletCard = ({ wallet, wallets, onUpdate, onDelete, onTransfer }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const optionsRef = useRef(null);

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    const getWalletIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'cash':
                return faMoneyBillWave;
            case 'credit card':
                return faCreditCard;
            case 'bank':
                return faUniversity;
            case 'savings':
                return faPiggyBank;
            default:
                return faWallet;
        }
    };

    const handleOptionsToggle = (e) => {
        e.stopPropagation();
        setShowOptions(prev => !prev);
        setShowDeleteConfirm(false);
    };

    const handleOutsideClick = useCallback((e) => {
        if (optionsRef.current && !optionsRef.current.contains(e.target)) {
            setShowOptions(false);
            setShowDeleteConfirm(false);
        }
    }, []);

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(wallet._id);
            setShowOptions(false);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowOptions(false);
            setShowDeleteConfirm(false);
        }
    };

    useEffect(() => {
        if (showOptions) {
            document.addEventListener('click', handleOutsideClick);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showOptions, handleOutsideClick]);

    return (
        <motion.div 
            className="wallet-card"
            role="article"
            aria-label={`Wallet: ${wallet.name}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -5 }}
        >
            <div className="wallet-card-header">
                <motion.div 
                    className="wallet-icon-container"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <FontAwesomeIcon 
                        icon={getWalletIcon(wallet.type)} 
                        className="wallet-icon" 
                        aria-hidden="true" 
                    />
                </motion.div>
                <div className="wallet-options" ref={optionsRef}>
                    <motion.button 
                        type="button" 
                        className="options-btn"
                        onClick={handleOptionsToggle}
                        aria-label="Wallet options"
                        aria-expanded={showOptions}
                        aria-haspopup="true"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <FontAwesomeIcon icon={faEllipsisV} aria-hidden="true" />
                    </motion.button>

                    <AnimatePresence>
                        {showOptions && (
                            <motion.div 
                                className="options-menu" 
                                role="menu" 
                                aria-label="Wallet options"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                            >
                                <motion.button 
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setShowOptions(false);
                                    }}
                                    role="menuitem"
                                    className="option-item"
                                    whileHover={{ x: 5 }}
                                >
                                    <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
                                    <span>Edit</span>
                                </motion.button>
                                <motion.button 
                                    onClick={handleDelete}
                                    role="menuitem"
                                    className={`option-item ${showDeleteConfirm ? 'delete-confirm' : 'delete'}`}
                                    whileHover={{ x: 5 }}
                                >
                                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                                    <span>{showDeleteConfirm ? 'Confirm Delete?' : 'Delete'}</span>
                                </motion.button>
                                <motion.button 
                                    onClick={() => {
                                        setShowTransferModal(true);
                                        setShowOptions(false);
                                    }}
                                    role="menuitem"
                                    className="option-item"
                                    whileHover={{ x: 5 }}
                                >
                                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                                    <span>Transfer</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <motion.div 
                className="wallet-card-content"
                initial={false}
                animate={{ scale: showOptions ? 0.98 : 1 }}
                transition={{ duration: 0.2 }}
            >
                <h3 className="wallet-name" title={wallet.name}>
                    {wallet.name}
                </h3>
                <div className="wallet-type" title={wallet.type}>
                    {wallet.type}
                </div>
                <motion.div 
                    className={`wallet-balance ${wallet.balance >= 0 ? 'positive' : 'negative'}`}
                    aria-label={`Balance: ${formatBalance(wallet.balance)}`}
                    initial={false}
                    animate={{ 
                        scale: [1, 1.05, 1],
                        transition: { duration: 0.3 }
                    }}
                    key={wallet.balance}
                >
                    {formatBalance(wallet.balance)}
                </motion.div>
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showEditModal && (
                    <EditWalletModal
                        wallet={wallet}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={onUpdate}
                    />
                )}

                {showTransferModal && (
                    <WalletTransfer
                        sourceWallet={wallet}
                        wallets={wallets}
                        onClose={() => setShowTransferModal(false)}
                        onUpdate={onUpdate}
                        onTransfer={onTransfer}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default WalletCard;