import React, { useState } from 'react';
import './styles/editTransactionModalStyles.css';

const EditTransactionModal = ({ isOpen, onClose, transaction, onUpdate, wallets = [], savingsAccounts = [], budgets = [], categories = [] }) => {
    if (!isOpen || !transaction) return null;

    const [amount, setAmount] = useState(transaction.amount);
    const [type, setType] = useState(transaction.type);
    const [description, setDescription] = useState(transaction.description);
    const [date, setDate] = useState(transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState(transaction.walletId || '');
    const [savingsAccountId, setSavingsAccountId] = useState(transaction.savingsAccountId || '');
    const [budgetId, setBudgetId] = useState(transaction.budgetId || '');
    const [category, setCategory] = useState(transaction.category || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({
            ...transaction,
            amount,
            type,
            description,
            date,
            walletId: walletId || null,
            savingsAccountId: savingsAccountId || null,
            budgetId: budgetId || null,
            category: category || null
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Transaction</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Wallet</label>
                        <select
                            value={walletId}
                            onChange={e => {
                                setWalletId(e.target.value);
                                setSavingsAccountId('');
                            }}
                        >
                            <option value="">Select a wallet</option>
                            {wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>{wallet.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Savings Account</label>
                        <select
                            value={savingsAccountId}
                            onChange={e => {
                                setSavingsAccountId(e.target.value);
                                setWalletId('');
                            }}
                        >
                            <option value="">Select a savings account</option>
                            {savingsAccounts.map(account => (
                                <option key={account._id} value={account._id}>{account.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Budget</label>
                        <select
                            value={budgetId}
                            onChange={e => setBudgetId(e.target.value)}
                        >
                            <option value="">Select a budget</option>
                            {budgets.map(budget => (
                                <option key={budget._id} value={budget._id}>{budget.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">Update Transaction</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;