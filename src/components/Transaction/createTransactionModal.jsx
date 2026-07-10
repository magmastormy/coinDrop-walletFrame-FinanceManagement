import { logError } from '../../utils/logger';

import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import transactionService from '../../services/transactionService';
import Modal from '../ui/Modal';
import ValidationUtils from '../../utils/validationUtils';
import useFormManager from '../../hooks/useFormManager';
import { Input } from '../ui/Input';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated, wallets = [], categories = [], budgets = [], savingsAccounts = [], initialData }) => {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { formData, updateField, resetForm } = useFormManager({
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
            updateField('amount', initialData.amount ?? '');
            updateField('type', initialData.type ?? 'expense');
            updateField('category', initialData.category?._id || initialData.category || '');
            updateField('description', initialData.description ?? '');
            updateField('date', initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            updateField('walletId', initialData.walletId?._id || initialData.walletId || '');
            updateField('savingsAccountId', initialData.savingsAccountId?._id || initialData.savingsAccountId || '');
            updateField('budgetId', initialData.budgetId?._id || initialData.budgetId || '');
            updateField('destinationWalletId', '');
            updateField('destinationSavingsAccountId', '');
        } else {
            resetForm();
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validate amount
            const amountValidation = ValidationUtils.validateAmount(formData.amount, false);
            if (!amountValidation.isValid) {
                throw new Error(amountValidation.error);
            }

            // Validate date
            const dateValidation = ValidationUtils.validateDate(formData.date, false);
            if (!dateValidation.isValid) {
                throw new Error(dateValidation.error);
            }

            // Validate source for transfers
            if (formData.type === 'transfer') {
                const hasSource = formData.walletId || formData.savingsAccountId;
                const hasDestination = formData.destinationWalletId || formData.destinationSavingsAccountId;
                
                if (!hasSource) {
                    throw new Error('Please select a source account for transfers');
                }
                
                if (!hasDestination) {
                    throw new Error('Please select a destination account for transfers');
                }
            }
            
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount) || 0,
                category: formData.category || undefined,
                walletId: formData.walletId || undefined,
                savingsAccountId: formData.savingsAccountId || undefined,
                budgetId: formData.budgetId || undefined,
                destinationWalletId: formData.destinationWalletId || undefined,
                destinationSavingsAccountId: formData.destinationSavingsAccountId || undefined
            };

            // Add timeout protection
            const apiCall = initialData?._id 
                ? transactionService.updateTransaction(initialData._id, payload)
                : transactionService.createTransaction(payload);
            
            await ValidationUtils.withTimeout(apiCall, 30000);
            
            onTransactionCreated?.(payload);
            onClose();
        } catch (err) {
            logError('Transaction error:', err);
            setError(err.message || 'Failed to save transaction. Please try again.');
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
                                    onChange={(e) => updateField('type', e.target.value)}
                                    onClick={() => {
                                        updateField('type', type);
                                        updateField('destinationWalletId', '');
                                        updateField('destinationSavingsAccountId', '');
                                    }}
                                    className="px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border"
                                    style={{
                                        backgroundColor: formData.type === type ? 'var(--color-primary-100)' : 'transparent',
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
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => updateField('amount', e.target.value)}
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label style={labelStyles}>Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label style={labelStyles}>Description</label>
                        <Input
                            placeholder="What was this for?"
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
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
                                    onChange={(e) => updateField('category', e.target.value)}
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
                                    onChange={(e) => updateField('budgetId', e.target.value)}
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
                                onChange={(e) => {
    updateField('walletId', e.target.value);
    updateField('savingsAccountId', '');
}}
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
                                onChange={(e) => {
    updateField('savingsAccountId', e.target.value);
    updateField('walletId', '');
}}
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
                                    onChange={(e) => {
    updateField('destinationWalletId', e.target.value);
    updateField('destinationSavingsAccountId', '');
}}
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
                                    onChange={(e) => {
    updateField('destinationSavingsAccountId', e.target.value);
    updateField('destinationWalletId', '');
}}
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
