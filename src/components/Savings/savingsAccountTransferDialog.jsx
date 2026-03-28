import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

export const SavingsAccountTransferDialog = ({
    open,
    accounts,
    sourceAccount,
    onClose,
    onTransfer
}) => {
    const [targetAccountId, setTargetAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate amount
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Check if amount exceeds source account balance
        if (numAmount > sourceAccount.balance) {
            setError('Transfer amount exceeds available balance');
            return;
        }

        // Check if target account is selected
        if (!targetAccountId) {
            setError('Please select a target account');
            return;
        }

        onTransfer(targetAccountId, numAmount);
        handleClose();
    };

    const handleClose = () => {
        setTargetAccountId('');
        setAmount('');
        setError('');
        onClose();
    };

    if (!sourceAccount) return null;

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title={`Transfer from ${sourceAccount.name}`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                    <p className="text-2xl font-bold text-primary">${sourceAccount.balance.toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Transfer To</label>
                    <select
                        value={targetAccountId}
                        onChange={(e) => setTargetAccountId(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            fontSize: '14px',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        <option value="" disabled>Select an account</option>
                        {accounts.map(account => (
                            <option key={account._id} value={account._id}>
                                {account.name} (${account.balance.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={error}
                />

                <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <Button variant="ghost" onClick={handleClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit">
                        Transfer
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SavingsAccountTransferDialog;
