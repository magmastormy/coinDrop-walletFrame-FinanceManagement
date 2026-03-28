import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import transactionService from '../../services/transactionService';
import Modal from '../ui/Modal';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated, wallets = [], categories = [], budgets = [], savingsAccounts = [], initialData }) => {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        walletId: '',
        savingsAccountId: '',
        budgetId: '',
        destinationWalletId: '',
        destinationSavingsAccountId: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                amount: initialData.amount ?? '',
                type: initialData.type ?? 'expense',
                category: initialData.category?._id || initialData.category || '',
                description: initialData.description ?? '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                walletId: initialData.walletId?._id || initialData.walletId || '',
                savingsAccountId: initialData.savingsAccountId?._id || initialData.savingsAccountId || '',
                budgetId: initialData.budgetId?._id || initialData.budgetId || '',
                destinationWalletId: '',
                destinationSavingsAccountId: ''
            });
        } else {
            setFormData({
                amount: '',
                type: 'expense',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                walletId: '',
                savingsAccountId: '',
                budgetId: '',
                destinationWalletId: '',
                destinationSavingsAccountId: ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');
            
            if (formData.type === 'transfer') {
                if (!formData.walletId && !formData.savingsAccountId) throw new Error('Please select a source account');
                if (!formData.destinationWalletId && !formData.destinationSavingsAccountId) throw new Error('Please select a destination account');
                if ((formData.walletId && formData.destinationWalletId) || (formData.savingsAccountId && formData.destinationSavingsAccountId)) {
                    throw new Error('Source and destination accounts must be different types');
                }
            } else {
                if (!formData.walletId && !formData.savingsAccountId) throw new Error('Please select a wallet or savings account');
            }

            const payload = {
                ...formData,
                amount,
                category: formData.category || undefined,
                walletId: formData.walletId || undefined,
                savingsAccountId: formData.savingsAccountId || undefined,
                budgetId: formData.budgetId || undefined,
                destinationWalletId: formData.destinationWalletId || undefined,
                destinationSavingsAccountId: formData.destinationSavingsAccountId || undefined
            };

            if (initialData?._id) {
                await transactionService.updateTransaction(initialData._id, payload);
            } else {
                await transactionService.createTransaction(payload);
            }

            onTransactionCreated?.(payload);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyles = {
        backgroundColor: 'var(--fc-surface-container-low)',
        border: '1px solid var(--fc-outline-variant)',
        color: 'var(--fc-on-surface)',
        borderRadius: '0.75rem'
    };

    const labelStyles = {
        color: 'var(--fc-on-tertiary-container)',
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '0.375rem',
        display: 'block'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Transaction' : 'New Transaction'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div 
                        className="p-3 text-sm rounded-lg"
                        style={{ 
                            backgroundColor: 'var(--fc-error-container)',
                            color: 'var(--fc-error)'
                        }}
                    >
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {/* Transaction Type */}
                    <div className="col-span-2">
                        <label style={labelStyles}>Transaction Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['income', 'expense', 'transfer'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type, destinationWalletId: '', destinationSavingsAccountId: '' })} 
                                    className="px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border"
                                    style={{
                                        backgroundColor: formData.type === type ? 'rgba(182, 196, 255, 0.1)' : 'transparent',
                                        borderColor: formData.type === type ? 'var(--fc-primary)' : 'var(--fc-outline-variant)',
                                        color: formData.type === type ? 'var(--fc-primary)' : 'var(--fc-on-tertiary-container)'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label style={labelStyles}>Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                            className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            style={inputStyles}
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label style={labelStyles}>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            style={inputStyles}
                        />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label style={labelStyles}>Description</label>
                        <input
                            placeholder="What was this for?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            style={inputStyles}
                        />
                    </div>

                    {/* Category and Budget - Show for Income and Expense only */}
                    {(formData.type === 'income' || formData.type === 'expense') && (
                        <>
                            {/* Category */}
                            <div className="col-span-2 sm:col-span-1">
                                <label style={labelStyles}>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                    style={inputStyles}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Budget */}
                            <div className="col-span-2 sm:col-span-1">
                                <label style={labelStyles}>Budget (Optional)</label>
                                <select
                                    value={formData.budgetId}
                                    onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                                    className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                    style={inputStyles}
                                >
                                    <option value="">Select Budget</option>
                                    {budgets.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Source Account */}
                    <div className="col-span-2">
                        <label style={labelStyles}>{formData.type === 'transfer' ? 'Source Account' : 'Account'}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={formData.walletId}
                                onChange={(e) => setFormData({ ...formData, walletId: e.target.value, savingsAccountId: '' })}
                                disabled={!!formData.savingsAccountId}
                                className="px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                                style={inputStyles}
                            >
                                <option value="">Select Wallet</option>
                                {wallets.map(w => (
                                    <option key={w._id} value={w._id}>{w.name}</option>
                                ))}
                            </select>
                            <select
                                value={formData.savingsAccountId}
                                onChange={(e) => setFormData({ ...formData, savingsAccountId: e.target.value, walletId: '' })}
                                disabled={!!formData.walletId}
                                className="px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                                style={inputStyles}
                            >
                                <option value="">Select Savings</option>
                                {savingsAccounts.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Destination Account - Show for Transfer only */}
                    {formData.type === 'transfer' && (
                        <div className="col-span-2">
                            <label style={labelStyles}>Destination Account</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    value={formData.destinationWalletId}
                                    onChange={(e) => setFormData({ ...formData, destinationWalletId: e.target.value, destinationSavingsAccountId: '' })}
                                    disabled={!!formData.destinationSavingsAccountId}
                                    className="px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                                    style={inputStyles}
                                >
                                    <option value="">Select Wallet</option>
                                    {wallets.map(w => (
                                        <option key={w._id} value={w._id}>{w.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={formData.destinationSavingsAccountId}
                                    onChange={(e) => setFormData({ ...formData, destinationSavingsAccountId: e.target.value, destinationWalletId: '' })}
                                    disabled={!!formData.destinationWalletId}
                                    className="px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                                    style={inputStyles}
                                >
                                    <option value="">Select Savings</option>
                                    {savingsAccounts.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ 
                            backgroundColor: 'var(--fc-surface-container-high)',
                            color: 'var(--fc-on-surface-variant)',
                            border: '1px solid var(--fc-outline-variant)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cta-gradient flex-1 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTransactionModal;
