import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import transactionService from '../../services/transactionService';
import './styles/transactionCreateNewStyles.css';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated, wallets }) => {
    const dispatch = useDispatch();
    const [transactionData, setTransactionData] = useState({
        amount: '',
        type: 'income', // Default type
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        walletId: '' // This will be set based on selected wallet
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await transactionService.createTransaction(transactionData);
            onTransactionCreated();
            onClose();
        } catch (error) {
            console.error('Transaction creation failed:', error);
        }
    };

    return (
        <div className={`modal ${isOpen ? 'open' : ''}`}>
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
                    <input
                        id="category"
                        type="text"
                        value={transactionData.category}
                        onChange={e => setTransactionData({ ...transactionData, category: e.target.value })}
                        required
                    />
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
                        {wallets.map(wallet => (
                            <option key={wallet._id} value={wallet._id}>
                                {wallet.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit">Create Transaction</button>
            </form>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

export default CreateTransactionModal;