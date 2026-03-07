import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const EditTransactionModal = ({ isOpen, onClose, transaction, onUpdate, wallets = [], savingsAccounts = [], budgets = [], categories = [] }) => {
    const [amount, setAmount] = useState(transaction?.amount ?? '');
    const [type, setType] = useState(transaction?.type ?? 'expense');
    const [description, setDescription] = useState(transaction?.description ?? '');
    const [date, setDate] = useState(transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState(transaction?.walletId || '');
    const [savingsAccountId, setSavingsAccountId] = useState(transaction?.savingsAccountId || '');
    const [budgetId, setBudgetId] = useState(transaction?.budgetId || '');
    const [category, setCategory] = useState(transaction?.category || '');

    useEffect(() => {
        if (!transaction) return;

        setAmount(transaction.amount ?? '');
        setType(transaction.type ?? 'expense');
        setDescription(transaction.description ?? '');
        setDate(transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setWalletId(transaction.walletId || '');
        setSavingsAccountId(transaction.savingsAccountId || '');
        setBudgetId(transaction.budgetId || '');
        setCategory(transaction.category || '');
    }, [transaction]);

    if (!isOpen || !transaction) return null;

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Transaction"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />

                <Input
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                    >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Description"
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Wallet</label>
                    <select
                        value={walletId}
                        onChange={e => {
                            setWalletId(e.target.value);
                            setSavingsAccountId('');
                        }}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                    >
                        <option value="">Select a wallet</option>
                        {wallets.map(wallet => (
                            <option key={wallet._id} value={wallet._id}>{wallet.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Savings Account</label>
                    <select
                        value={savingsAccountId}
                        onChange={e => {
                            setSavingsAccountId(e.target.value);
                            setWalletId('');
                        }}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                    >
                        <option value="">Select a savings account</option>
                        {savingsAccounts.map(account => (
                            <option key={account._id} value={account._id}>{account.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Budget</label>
                    <select
                        value={budgetId}
                        onChange={e => setBudgetId(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                    >
                        <option value="">Select a budget</option>
                        {budgets.map(budget => (
                            <option key={budget._id} value={budget._id}>{budget.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit">
                        Update Transaction
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditTransactionModal;
