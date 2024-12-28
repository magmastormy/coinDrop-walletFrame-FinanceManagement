import React, { useState } from 'react';
import transactionService from '../../services/transactionService';
import './styles/transactionCreateNewStyles.css';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated, wallets=[], categories=[], initialData }) => {
    if (!isOpen) return null;
    const [error, setError] = useState('');

    const [transactionData, setTransactionData] = useState(initialData || {
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        walletId: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!transactionData.walletId || !transactionData.category) {
                throw new Error('Please select both wallet and category');
            }
            
            if (parseFloat(transactionData.amount) <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            const cleanTransactionData = {
                amount: amount,
                type: transactionData.type,
                category: transactionData.category,
                description: transactionData.description || '',
                date: transactionData.date || new Date().toISOString().split('T')[0],
                walletId: transactionData.walletId
            };
    
            const response = await transactionService.createTransaction(cleanTransactionData);
            onTransactionCreated(response);
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to create transaction');
            console.error('Transaction creation failed:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{initialData ? 'Edit' : 'Create'} Transaction</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="amount">Amount</label>
                        <input
                            id="amount"
                            type="number"
                            value={transactionData.amount}
                            onChange={e => setTransactionData({ ...transactionData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">Type</label>
                        <select
                            id="type"
                            value={transactionData.type}
                            onChange={e => setTransactionData({ ...transactionData, type: e.target.value })}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={transactionData.category}
                            onChange={e => setTransactionData({ ...transactionData, category: e.target.value })}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <input
                            id="description"
                            type="text"
                            value={transactionData.description}
                            onChange={e => setTransactionData({ ...transactionData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={transactionData.date}
                            onChange={e => setTransactionData({ ...transactionData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="wallet">Wallet</label>
                        <select
                            id="wallet"
                            value={transactionData.walletId}
                            onChange={e => setTransactionData({ ...transactionData, walletId: e.target.value })}
                            required
                        >
                            <option value="">Select a wallet</option>
                            {Array.isArray(wallets) && wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit">{initialData ? 'Update' : 'Create'} Transaction</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTransactionModal;