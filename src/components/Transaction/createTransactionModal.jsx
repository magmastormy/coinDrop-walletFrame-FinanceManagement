import React, { useState } from 'react';
import transactionService from '../../services/transactionService';
import './styles/transactionStyles.css';
const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated }) => {
    const [transactionData, setTransactionData] = useState({
        walletId: '',
        amount: 0,
        type: 'expense',
        description: '',
        date: '',
        paymentMethod: 'cash',
        category: '',
        subcategory: ''
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            await transactionService.createTransaction(transactionData);
            onTransactionCreated(); // Notify parent to refresh transactions
            setTransactionData({ walletId: '', amount: 0, type: 'expense', description: '', date: '', paymentMethod: 'cash', category: '', subcategory: '' }); // Reset form
        } catch (err) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Create New Transaction</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="walletId">Wallet ID</label>
                        <input
                            id="walletId"
                            type="text"
                            value={transactionData.walletId}
                            onChange={e => setTransactionData({ ...transactionData, walletId: e.target.value })}
                            required
                        />
                    </div>
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
                        <label htmlFor="paymentMethod">Payment Method</label>
                        <select
                            id="paymentMethod"
                            value={transactionData.paymentMethod}
                            onChange={e => setTransactionData({ ...transactionData, paymentMethod: e.target.value })}
                        >
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="digital_wallet">Digital Wallet</option>
                            <option value="other">Other</option>
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
                        <label htmlFor="subcategory">Subcategory</label>
                        <input
                            id="subcategory"
                            type="text"
                            value={transactionData.subcategory}
                            onChange={e => setTransactionData({ ...transactionData, subcategory: e.target.value })}
                        />
                    </div>
                    <button type="submit">Create Transaction</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default CreateTransactionModal;