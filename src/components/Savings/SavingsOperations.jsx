import React from 'react';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const SavingsOperations = ({
    modalState,
    setModalState,
    handleTransaction,
    selectedAccount,
    transactionAmount,
    setTransactionAmount,
    wallets,
    selectedWallet,
    setSelectedWallet
}) => {
    const handleClose = (type) => {
        setModalState(prev => ({
            ...prev,
            [type]: { ...prev[type], open: false }
        }));
        setTransactionAmount(0);
        setSelectedWallet('');
    };

    const renderTransactionDialog = (type) => {
        const isOpen = modalState[type].open;
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        const needsWallet = ['deposit', 'withdraw', 'transfer'].includes(type);

        return (
            <Modal
                isOpen={isOpen}
                onClose={() => handleClose(type)}
                title={`${title} Funds`}
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <Input
                        autoFocus
                        label="Amount"
                        type="number"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        min="0"
                        placeholder="0.00"
                    />

                    {needsWallet && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Select Wallet</label>
                            <select
                                value={selectedWallet}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                            >
                                <option value="" disabled>Select a wallet</option>
                                {wallets.map((wallet) => (
                                    <option key={wallet._id} value={wallet._id}>
                                        {wallet.name} ({new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        }).format(wallet.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button variant="ghost" onClick={() => handleClose(type)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                handleTransaction(type, selectedAccount, transactionAmount, selectedWallet);
                                handleClose(type);
                            }}
                            disabled={!transactionAmount || (needsWallet && !selectedWallet)}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    };

    return (
        <>
            {renderTransactionDialog('deposit')}
            {renderTransactionDialog('withdraw')}
            {renderTransactionDialog('transfer')}
        </>
    );
};

export default SavingsOperations;
