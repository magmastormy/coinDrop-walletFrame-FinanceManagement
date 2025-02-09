import React, { useState, useEffect, useCallback } from 'react';
import transactionService from '../../services/transactionService';
import './styles/transactionCreateNewStyles.css';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated, wallets=[], categories=[], budgets=[], savingsAccounts=[], initialData }) => {
    if (!isOpen) return null;
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [transactionData, setTransactionData] = useState(initialData || {
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        walletId: '',
        savingsAccountId: '',
        budgetId: ''
    });

    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [handleEscapeKey]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        try {
            if (!transactionData.walletId && !transactionData.savingsAccountId) {
                throw new Error('Please select either a wallet or a savings account');
            }
            
            if (parseFloat(transactionData.amount) <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            const cleanTransactionData = {
                amount: transactionData.amount,
                type: transactionData.type,
                category: transactionData.category,
                description: transactionData.description || '',
                date: transactionData.date || new Date().toISOString().split('T')[0],
                walletId: transactionData.walletId || undefined,
                savingsAccountId: transactionData.savingsAccountId || undefined,
                budgetId: transactionData.budgetId || undefined
            };
    
            const response = await transactionService.createTransaction(cleanTransactionData);
            onTransactionCreated(response);
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to create transaction');
            console.error('Transaction creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay fade-in" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
            <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
                <h2 id="transaction-modal-title">{initialData ? 'Edit' : 'Create'} Transaction</h2>
                {error && <div className="error-message" role="alert">{error}</div>}
                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="form-group">
                        <label htmlFor="amount">Amount</label>
                        <input
                            id="amount"
                            type="number"
                            value={transactionData.amount}
                            onChange={e => setTransactionData({ ...transactionData, amount: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
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
                            placeholder="Enter description (optional)"
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
                            onChange={e => setTransactionData({ ...transactionData, walletId: e.target.value, savingsAccountId: '' })}
                        >
                            <option value="">Select a wallet</option>
                            {Array.isArray(wallets) && wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="savingsAccount">Savings Account</label>
                        <select
                            id="savingsAccount"
                            value={transactionData.savingsAccountId}
                            onChange={e => setTransactionData({ ...transactionData, savingsAccountId: e.target.value, walletId: '' })}
                        >
                            <option value="">Select a savings account</option>
                            {Array.isArray(savingsAccounts) && savingsAccounts.map(account => (
                                <option key={account._id} value={account._id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="budget">Budget</label>
                        <select
                            id="budget"
                            value={transactionData.budgetId}
                            onChange={e => setTransactionData({ ...transactionData, budgetId: e.target.value })}
                        >
                            <option value="">Select a budget</option>
                            {budgets.map(budget => (
                                <option key={budget._id} value={budget._id}>
                                    {budget.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : initialData ? 'Update' : 'Create'} Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTransactionModal;