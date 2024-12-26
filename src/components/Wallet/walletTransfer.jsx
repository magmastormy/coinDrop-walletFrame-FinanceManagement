import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './styles/walletTransferStyles.css';

const WalletTransfer = ({ wallets, onClose, onTransfer }) => {
    const [formData, setFormData] = useState({
        fromWalletId: '',
        toWalletId: '',
        amount: ''
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const { fromWalletId, toWalletId, amount } = formData;
            if (!fromWalletId || !toWalletId || !amount) {
                throw new Error('All fields are required');
            }

            await onTransfer(fromWalletId, toWalletId, parseFloat(amount));
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to transfer money');
        }
    };

    return (
        <div className="wallet-transfer-modal">
            <div className="transfer-content">
                <div className="transfer-header">
                    <h2>Transfer Money</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="transfer-form-group">
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

                    <div className="transfer-form-group">
                        <label>To Wallet:</label>
                        <select
                            name="toWalletId"
                            value={formData.toWalletId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Wallet</option>
                            {wallets.map(wallet => (
                                wallet._id !== formData.fromWalletId && (
                                    <option key={wallet._id} value={wallet._id}>
                                        {wallet.name} (${wallet.balance})
                                    </option>
                                )
                            ))}
                        </select>
                    </div>

                    <div className="transfer-form-group">
                        <label>Amount:</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="transfer-actions">
                        <button type="submit" className="create-btn">Transfer</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WalletTransfer;