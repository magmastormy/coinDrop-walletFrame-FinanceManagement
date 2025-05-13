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

    // Always reflect initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            // Log the initialData for debugging
            console.log('Initializing modal with data:', initialData);
            
            // Handle wallet and savings account IDs properly
            let walletId = '';
            let savingsAccountId = '';
            
            // Check if walletId exists and is a valid ID
            if (initialData.walletId) {
                if (typeof initialData.walletId === 'string') {
                    walletId = initialData.walletId;
                } else if (initialData.walletId._id) {
                    // If it's an object with _id property, use that
                    walletId = initialData.walletId._id;
                }
            }
            
            // Check if savingsAccountId exists and is a valid ID
            if (initialData.savingsAccountId) {
                if (typeof initialData.savingsAccountId === 'string') {
                    savingsAccountId = initialData.savingsAccountId;
                } else if (initialData.savingsAccountId._id) {
                    // If it's an object with _id property, use that
                    savingsAccountId = initialData.savingsAccountId._id;
                }
            }
            
            // Handle budget ID properly
            let budgetId = '';
            if (initialData.budgetId) {
                if (typeof initialData.budgetId === 'string') {
                    budgetId = initialData.budgetId;
                } else if (initialData.budgetId._id) {
                    budgetId = initialData.budgetId._id;
                }
            }
            
            // This is needed because sometimes the budget is not populated as an object
            if (!budgetId) {
                // Check for _doc property (MongoDB document)
                if (initialData._doc && initialData._doc.budgetId) {
                    budgetId = initialData._doc.budgetId.toString();
                }
                // Direct property access
                else if (initialData.budgetId) {
                    budgetId = initialData.budgetId.toString();
                }
            }
            
            console.log('[createTransactionModal] Budget ID extracted:', budgetId, 'from initialData:', initialData);
            
            // Handle category ID properly
            let category = '';
            if (initialData.category) {
                if (typeof initialData.category === 'string') {
                    category = initialData.category;
                } else if (initialData.category._id) {
                    category = initialData.category._id;
                }
            }
            
            setTransactionData({
                amount: initialData.amount ?? '',
                type: initialData.type ?? 'expense',
                category: category,
                description: initialData.description ?? '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                walletId: walletId,
                savingsAccountId: savingsAccountId,
                budgetId: budgetId
            });
        } else {
            setTransactionData({
                amount: '',
                type: 'expense',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                walletId: '',
                savingsAccountId: '',
                budgetId: ''
            });
        }
    }, [initialData, isOpen]);

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
            // Validate amount first
            const amount = parseFloat(transactionData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid positive amount');
            }

            // Validate transaction type
            if (!transactionData.type) {
                throw new Error('Please select a transaction type');
            }

            // Validate category or description
            if (!transactionData.category && (!transactionData.description || transactionData.description.trim() === '')) {
                throw new Error('Please select a category or provide a description');
            }

            // Validate wallet or savings account selection
            const hasWallet = transactionData.walletId && transactionData.walletId.trim() !== '';
            const hasSavings = transactionData.savingsAccountId && transactionData.savingsAccountId.trim() !== '';
            
            if (!hasWallet && !hasSavings) {
                throw new Error('Please select a wallet or savings account');
            }

            // Ensure only one of wallet or savings account is selected
            const cleanTransactionData = {
                amount: amount,
                type: transactionData.type,
                category: transactionData.category || undefined,
                description: transactionData.description || '',
                date: transactionData.date || new Date().toISOString().split('T')[0],
            };

            // Add either walletId or savingsAccountId, not both
            if (hasWallet) {
                cleanTransactionData.walletId = transactionData.walletId;
            } else if (hasSavings) {
                cleanTransactionData.savingsAccountId = transactionData.savingsAccountId;
            }

            // Add budgetId if present and valid
            if (transactionData.budgetId && transactionData.budgetId.trim() !== '') {
                cleanTransactionData.budgetId = transactionData.budgetId;
            }

            console.log("[create Transaction Modal - handleSubmit] cleanTransactionData: ", cleanTransactionData);

            let response;
            if (initialData && initialData._id) {
                // Update mode
                response = await transactionService.updateTransaction(initialData._id, cleanTransactionData);
                onTransactionCreated(response.data ? response.data.transaction : response);
            } else {
                // Create mode
                response = await transactionService.createTransaction(cleanTransactionData);
                onTransactionCreated(response);
            }
            onClose();
        } catch (err) {
            console.error('[create Transaction Modal - handleSubmit] Error submitting transaction:', err);
            setError(err.message || 'An error occurred while creating the transaction');
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
                        <label htmlFor="category">Category (optional if description provided)</label>
                        <select
                            id="category"
                            value={transactionData.category}
                            onChange={e => setTransactionData({ ...transactionData, category: e.target.value })}
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
                            onChange={e => setTransactionData({ ...transactionData, walletId: String(e.target.value), savingsAccountId: '' })}
                        >
                            <option value="">Select a wallet</option>
                            {Array.isArray(wallets) && wallets.map(wallet => (
                                <option key={wallet._id} value={String(wallet._id)}>
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
                            onChange={e => setTransactionData({ ...transactionData, savingsAccountId: String(e.target.value), walletId: '' })}
                        >
                            <option value="">Select a savings account</option>
                            {Array.isArray(savingsAccounts) && savingsAccounts.map(account => (
                                <option key={account._id} value={String(account._id)}>
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