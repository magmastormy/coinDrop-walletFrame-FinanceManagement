import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faExchangeAlt, 
    faArrowRight,
    faWallet,
    faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import './styles/walletTransferStyles.css';

const WalletTransfer = ({ sourceWallet, wallets, onClose, onTransfer }) => {
    const [formData, setFormData] = useState({
        fromWalletId: sourceWallet._id,
        toWalletId: '',
        amount: ''
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, []);

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
        setShowConfirmation(false);
    };

    const validateForm = () => {
        const { toWalletId, amount } = formData;
        if (!toWalletId) {
            throw new Error('Please select a destination wallet');
        }
        if (!amount || amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        if (parseFloat(amount) > sourceWallet.balance) {
            throw new Error('Insufficient funds in source wallet');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            validateForm();
            if (!showConfirmation) {
                setShowConfirmation(true);
                return;
            }

            setIsLoading(true);
            const { fromWalletId, toWalletId, amount } = formData;
            await onTransfer(fromWalletId, toWalletId, parseFloat(amount));
            handleClose();
        } catch (error) {
            setError(error.message || 'Failed to transfer money');
            setShowConfirmation(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setShowConfirmation(false);
        onClose();
    };

    const getDestinationWallet = () => {
        return wallets.find(w => w._id === formData.toWalletId);
    };

    return (
        <motion.div 
            className="modal-overlay"
            role="dialog"
            aria-labelledby="transfer-title"
            aria-modal="true"
            onClick={(e) => e.target.className === 'modal-overlay' && handleClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div 
                className="wallet-transfer-modal"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="transfer-content">
                    <div className="transfer-header">
                        <motion.h2 
                            id="transfer-title"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <FontAwesomeIcon icon={faExchangeAlt} aria-hidden="true" />
                            Transfer Money
                        </motion.h2>
                        <motion.button 
                            className="modal-close"
                            onClick={handleClose}
                            aria-label="Close transfer modal"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                        </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                className="error-message" 
                                role="alert"
                                aria-live="polite"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="transfer-form-group">
                            <label htmlFor="fromWalletId">From Wallet:</label>
                            <div className="wallet-select-wrapper">
                                <FontAwesomeIcon icon={faWallet} className="wallet-icon" aria-hidden="true" />
                                <select
                                    id="fromWalletId"
                                    name="fromWalletId"
                                    value={formData.fromWalletId}
                                    onChange={handleChange}
                                    disabled
                                    aria-label="Source wallet"
                                >
                                    <option value={sourceWallet._id}>
                                        {sourceWallet.name} ({formatBalance(sourceWallet.balance)})
                                    </option>
                                </select>
                            </div>
                        </div>

                        <motion.div 
                            className="transfer-arrow"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                        </motion.div>

                        <div className="transfer-form-group">
                            <label htmlFor="toWalletId">To Wallet:</label>
                            <div className="wallet-select-wrapper">
                                <FontAwesomeIcon icon={faWallet} className="wallet-icon" aria-hidden="true" />
                                <select
                                    id="toWalletId"
                                    name="toWalletId"
                                    value={formData.toWalletId}
                                    onChange={handleChange}
                                    required
                                    aria-label="Destination wallet"
                                    aria-invalid={error && !formData.toWalletId ? 'true' : 'false'}
                                >
                                    <option value="">Select Wallet</option>
                                    {wallets && wallets.filter(wallet => wallet._id !== sourceWallet._id)
                                        .map(wallet => (
                                            <option key={wallet._id} value={wallet._id}>
                                                {wallet.name} ({formatBalance(wallet.balance)})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="transfer-form-group">
                            <label htmlFor="amount">Amount:</label>
                            <div className="amount-input-wrapper">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="amount-icon" aria-hidden="true" />
                                <input
                                    id="amount"
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    aria-label="Transfer amount"
                                    aria-invalid={error && !formData.amount ? 'true' : 'false'}
                                />
                            </div>
                            <div className="available-balance">
                                Available: {formatBalance(sourceWallet.balance)}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {showConfirmation ? (
                                <motion.div 
                                    className="confirmation-message"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    role="alert"
                                >
                                    <h3>Confirm Transfer</h3>
                                    <p>
                                        Transfer {formatBalance(parseFloat(formData.amount))} from{' '}
                                        <strong>{sourceWallet.name}</strong> to{' '}
                                        <strong>{getDestinationWallet()?.name}</strong>?
                                    </p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <div className="transfer-actions">
                            <motion.button 
                                type="submit" 
                                className={`create-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? 'Transferring...' : (showConfirmation ? 'Confirm Transfer' : 'Transfer')}
                            </motion.button>
                            <motion.button 
                                type="button" 
                                className="cancel-btn" 
                                onClick={handleClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WalletTransfer;