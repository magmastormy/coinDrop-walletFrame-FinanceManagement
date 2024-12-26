import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import WalletIconOptions from './newWalletIcons';
import walletService from '../../services/walletService';
import { addWallet } from '../../slices/walletSlice';
import './styles/newWalletStyles.css';

const CreateNewWallet = ({ onWalletCreated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletData, setWalletData] = useState({
        name: '',
        type: 'bank', // default type
        balance: '',
        icon: 'default-wallet-icon' // default icon
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            // Validate balance is a number
            const balance = parseFloat(walletData.balance);
            if (isNaN(balance)) {
                throw new Error('Balance must be a valid number');
            }

            const newWallet = await walletService.createWallet({
                ...walletData,
                balance: balance
            });

            if (newWallet) {
                onWalletCreated(); // Refresh wallet list
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error('Failed to create wallet:', error);
            setError(error.message || 'Failed to create wallet');
        }
    };

    const resetForm = () => {
        setWalletData({
            name: '',
            type: 'bank',
            balance: '',
            icon: 'default-wallet-icon'
        });
        setError(null);
    };

    const handleIconSelect = (icon) => {
        setWalletData(prev => ({ ...prev, icon }));
        console.log("New Wallet - handle icon select: ", icon);
    };

    return (
        <>
            <button 
                className="create-wallet-btn"
                onClick={() => setIsModalOpen(true)}
            >
                + Create New Wallet
            </button>

            {isModalOpen && (
                <div className="wallet-modal-overlay">
                    <div className="wallet-modal">
                        <h2>Create New Wallet</h2>
                        {error && <div className="error-message">{error}</div>}
                        
                        <form onSubmit={handleSubmit}>
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
                                    required
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
                                >
                                    <option value="bank">Bank Account</option>
                                    <option value="cash">Cash</option>
                                    <option value="credit">Credit Card</option>
                                    <option value="savings">Savings</option>
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
                                    required
                                />
                            </div>

                            <WalletIconOptions
                                selectedIcon={walletData.icon}
                                onSelectIcon={handleIconSelect}
                            />

                            <div className="modal-actions">
                                <button type="submit" className="create-btn">
                                    Create Wallet
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateNewWallet;
