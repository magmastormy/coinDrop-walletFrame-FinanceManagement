// src/components/Wallet/editWalletModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import WalletIconOptions from './newWalletIcons';
import walletService from '../../services/walletService';
import { updateWallet } from '../../slices/walletSlice';
import './styles/editWalletStyles.css';

const EditWalletModal = ({ wallet, onClose, onUpdate }) => {
    const dispatch = useDispatch();
    const [walletData, setWalletData] = useState({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance,
        icon: wallet.icon || 'default-wallet-icon'
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const balance = parseFloat(walletData.balance);

            if (isNaN(balance)) {
                throw new Error('Please enter a valid balance');
            }

            const updatedWallet = await walletService.updateWallet(wallet._id, {
                ...walletData,
                balance
            });
            
            dispatch(updateWallet(updatedWallet));
            onUpdate?.(updatedWallet);
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to update wallet');
        }
    };

    return (
        <div className="wallet-edit-modal">
            <div className="wallet-content">
                <div className="edit-header">
                    <h2>Edit Wallet</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="edit-form-group">
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
                    <div className="edit-form-group">
                        <label htmlFor="walletBalance">Wallet Balance</label>
                        <input
                            id="walletBalance"
                            type="number"
                            min="0"
                            step="0.01"
                            value={walletData.balance}
                            onChange={e => setWalletData(prev => ({
                                ...prev,
                                balance: parseFloat(e.target.value)
                            }))}
                            required
                        />
                    </div>

                    <div className="edit-form-group">
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
                            <option value="investment">Investment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <WalletIconOptions
                        selectedIcon={walletData.icon}
                        onSelectIcon={icon => setWalletData(prev => ({ ...prev, icon }))}
                    />

                    <div className="edit-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditWalletModal;