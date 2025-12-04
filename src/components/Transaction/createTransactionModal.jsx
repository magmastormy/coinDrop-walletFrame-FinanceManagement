import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import transactionService from '../../services/transactionService';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

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
        budgetId: ''
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
                budgetId: initialData.budgetId?._id || initialData.budgetId || ''
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
                budgetId: ''
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
            if (!formData.walletId && !formData.savingsAccountId) throw new Error('Please select a wallet or savings account');

            const payload = {
                ...formData,
                amount,
                category: formData.category || undefined,
                walletId: formData.walletId || undefined,
                savingsAccountId: formData.savingsAccountId || undefined,
                budgetId: formData.budgetId || undefined
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Transaction' : 'New Transaction'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Transaction Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['income', 'expense', 'transfer'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border",
                                        formData.type === type
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-transparent border-border hover:bg-secondary/50 text-muted-foreground"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                    />

                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

                    <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
                        <Input
                            placeholder="What was this for?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
                        <select
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Budget (Optional)</label>
                        <select
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            value={formData.budgetId}
                            onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                        >
                            <option value="">Select Budget</option>
                            {budgets.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Source Account</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                value={formData.walletId}
                                onChange={(e) => setFormData({ ...formData, walletId: e.target.value, savingsAccountId: '' })}
                                disabled={!!formData.savingsAccountId}
                            >
                                <option value="">Select Wallet</option>
                                {wallets.map(w => (
                                    <option key={w._id} value={w._id}>{w.name}</option>
                                ))}
                            </select>
                            <select
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                value={formData.savingsAccountId}
                                onChange={(e) => setFormData({ ...formData, savingsAccountId: e.target.value, walletId: '' })}
                                disabled={!!formData.walletId}
                            >
                                <option value="">Select Savings</option>
                                {savingsAccounts.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {initialData ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTransactionModal;