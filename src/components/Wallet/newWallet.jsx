import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import WalletIconOptions from './newWalletIcons';
import walletService from '../../services/walletService';
import { useDispatch } from 'react-redux';
import { addWallet } from '../../slices/walletSlice';
import './styles/newWalletStyles.css';

const CreateNewWallet = ({ onWalletCreated }) => {
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletData, setWalletData] = useState({
        name: '',
        type: 'bank',
        balance: '',
        icon: 'default-wallet-icon'
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                handleClose();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const balance = parseFloat(walletData.balance);
            if (isNaN(balance)) {
                throw new Error('Balance must be a valid number');
            }

            const newWallet = await walletService.createWallet({
                ...walletData,
                balance: balance
            });

            if (newWallet) {
                dispatch(addWallet(newWallet));
                onWalletCreated();
                handleClose();
            }
        } catch (error) {
            console.error('Failed to create wallet:', error);
            setError(error.message || 'Failed to create wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setWalletData({
            name: '',
            type: 'bank',
            balance: '',
            icon: 'default-wallet-icon'
        });
        setError(null);
        setIsLoading(false);
    };

    const handleIconSelect = (icon) => {
        setWalletData(prev => ({ ...prev, icon }));
    };

    return (
        <>
            <motion.button 
                className="create-wallet-btn"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Create new wallet"
            >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                <span>Create New Wallet</span>
            </motion.button>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-container">
                        <motion.div 
                            className="wallet-modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                        />
                        <motion.div 
                            className="wallet-modal"
                            role="dialog"
                            aria-labelledby="modal-title"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2 id="modal-title">Create New Wallet</h2>
                                <motion.button
                                    className="close-btn"
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label="Close modal"
                                >
                                    <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                                </motion.button>
                            </div>

                            {error && (
                                <motion.div 
                                    className="error-message"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    role="alert"
                                >
                                    {error}
                                </motion.div>
                            )}
                            
                            <form onSubmit={handleSubmit} id="modal-description">
                                <div className="form-group">
                                    <label htmlFor="walletName">Wallet Name</label>
                                    <input
                                        id="walletName"
                                        type="text"
                                        value={walletData.name}
                                        onChange={e => setWalletData(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        placeholder="Enter wallet name"
                                        required
                                        aria-required="true"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="walletType">Wallet Type</label>
                                    <select
                                        id="walletType"
                                        value={walletData.type}
                                        onChange={e => setWalletData(prev => ({
                                            ...prev,
                                            type: e.target.value
                                        }))}
                                        required
                                        aria-required="true"
                                    >
                                        <option value="bank">Bank Account</option>
                                        <option value="cash">Cash</option>
                                        <option value="credit">Credit Card</option>
                                        <option value="savings">Savings</option>
                                        <option value="investment">Investment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="walletBalance">Initial Balance</label>
                                    <input
                                        id="walletBalance"
                                        type="number"
                                        step="0.01"
                                        value={walletData.balance}
                                        onChange={e => setWalletData(prev => ({
                                            ...prev,
                                            balance: e.target.value
                                        }))}
                                        placeholder="0.00"
                                        required
                                        aria-required="true"
                                        aria-label="Initial balance in dollars"
                                    />
                                </div>

                                <WalletIconOptions 
                                    selectedIcon={walletData.icon}
                                    onSelect={handleIconSelect}
                                />

                                <div className="modal-actions">
                                    <button
                                        type="submit"
                                        className="create-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Wallet'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CreateNewWallet;
