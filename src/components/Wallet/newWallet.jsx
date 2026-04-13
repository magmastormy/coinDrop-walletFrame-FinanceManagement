import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Wallet, CreditCard, Building2, PiggyBank, MoreHorizontal } from 'lucide-react';
import { addWallet } from '../../slices/walletSlice';
import walletService from '../../services/walletService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import useFormManager from '../../hooks/useFormManager';
import GridSelector from '../ui/GridSelector';

const CreateNewWallet = ({ onWalletCreated, triggerButton }) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { formData, updateField, resetForm } = useFormManager({
        name: '',
        type: 'bank',
        balance: '',
        icon: 'default'
    });

    const walletTypes = [
        { id: 'bank', label: 'Bank Account', icon: Building2 },
        { id: 'cash', label: 'Cash', icon: Wallet },
        { id: 'credit card', label: 'Credit Card', icon: CreditCard },
        { id: 'savings', label: 'Savings', icon: PiggyBank },
        { id: 'other', label: 'Other', icon: MoreHorizontal },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const balance = parseFloat(formData.balance) || 0;
            if (isNaN(balance) || balance < 0) throw new Error('Please enter a valid balance');

            const newWallet = await walletService.createWallet({
                ...formData,
                balance
            });

            if (newWallet) {
                dispatch(addWallet(newWallet));
                onWalletCreated?.();
                setIsOpen(false);
                resetForm();
            }
        } catch (err) {
            setError(err.message || 'Failed to create wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    return (
        <>
            {triggerButton ? (
                <div onClick={handleOpen} className="cursor-pointer">
                    {triggerButton}
                </div>
            ) : (
                <Button onClick={handleOpen} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Wallet
                </Button>
            )}

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Create New Wallet"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Wallet Type</label>
                            <GridSelector
                                options={walletTypes}
                                selected={formData.type}
                                onSelect={(type) => updateField('type', type)}
                                columns={3}
                            />
                        </div>

                        <Input
                            label="Wallet Name"
                            placeholder="e.g. Main Checking"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />

                        <Input
                            label="Initial Balance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.balance}
                            onChange={(e) => updateField('balance', e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isLoading}>
                            Create Wallet
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default CreateNewWallet;
