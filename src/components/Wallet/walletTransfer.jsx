// src/components/Wallet/walletTransfer.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import walletService from '../../services/walletService';
import { updateWallet } from '../../slices/walletSlice';
import './styles/walletStyles.css';

const WalletTransfer = () => {
    const dispatch = useDispatch();
    const wallets = useSelector(state => state.wallet.wallets);
    const [formData, setFormData] = useState({
        fromWalletId: '',
        toWalletId: '',
        amount: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { fromWalletId, toWalletId, amount } = formData;
            
            if (fromWalletId === toWalletId) {
                setError("Cannot transfer to the same wallet");
                return;
            }

            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                setError("Please enter a valid amount");
                return;
            }

            const fromWallet = wallets.find(w => w._id === fromWalletId);
            if (fromWallet.balance < numAmount) {
                setError("Insufficient funds");
                return;
            }

            const result = await walletService.transferBetweenWallets(
                fromWalletId,
                toWalletId,
                numAmount
            );

            // Update both wallets in the Redux store
            dispatch(updateWallet(result.fromWallet));
            dispatch(updateWallet(result.toWallet));

            // Reset form
            setFormData({
                fromWalletId: '',
                toWalletId: '',
                amount: ''
            });
        } catch (error) {
            setError(error.response?.data?.message || "Transfer failed");
        }
    };

    return (
        <div className="wallet-transfer-container">
            <h2>Transfer Money</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>From Wallet:</label>
                    <select
                        name="fromWalletId"
                        value={formData.fromWalletId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Wallet</option>
                        {wallets.map(wallet => (
                            <option key={wallet._id} value={wallet._id}>
                                {wallet.name} (${wallet.balance})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>To Wallet:</label>
                    <select
                        name="toWalletId"
                        value={formData.toWalletId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Wallet</option>
                        {wallets.map(wallet => (
                            <option key={wallet._id} value={wallet._id}>
                                {wallet.name} (${wallet.balance})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Amount:</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        required
                    />
                </div>

                <button type="submit" className="transfer-button">
                    Transfer
                </button>
            </form>
        </div>
    );
};

export default WalletTransfer;
