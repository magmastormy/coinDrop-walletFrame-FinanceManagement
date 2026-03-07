import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import WalletIconOptions from './newWalletIcons';
import walletService from '../../services/walletService';
import { updateWallet } from '../../slices/walletSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GlassCard } from '../ui/GlassCard';

const EditWalletModal = ({ wallet, onClose, onUpdate }) => {
    const dispatch = useDispatch();
    const [walletData, setWalletData] = useState({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance,
        icon: wallet.icon || 'Wallet'
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const balance = parseFloat(walletData.balance);

            if (isNaN(balance)) {
                throw new Error('Please enter a valid balance');
            }

            const updatedWallet = await walletService.updateWallet(wallet._id, {
                ...walletData,
                balance
            });

            dispatch(updateWallet(updatedWallet));
            onUpdate?.(updatedWallet);
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to update wallet');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Edit Wallet</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="walletName" className="block text-sm font-medium text-foreground mb-2">
                            Wallet Name
                        </label>
                        <Input
                            id="walletName"
                            type="text"
                            value={walletData.name}
                            onChange={e => setWalletData(prev => ({
                                ...prev,
                                name: e.target.value
                            }))}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="walletBalance" className="block text-sm font-medium text-foreground mb-2">
                            Wallet Balance
                        </label>
                        <Input
                            id="walletBalance"
                            type="number"
                            min="0"
                            step="0.01"
                            value={walletData.balance}
                            onChange={e => setWalletData(prev => ({
                                ...prev,
                                balance: parseFloat(e.target.value)
                            }))}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="walletType" className="block text-sm font-medium text-foreground mb-2">
                            Wallet Type
                        </label>
                        <select
                            id="walletType"
                            value={walletData.type}
                            onChange={e => setWalletData(prev => ({
                                ...prev,
                                type: e.target.value
                            }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="bank">Bank Account</option>
                            <option value="cash">Cash</option>
                            <option value="credit">Credit Card</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Wallet Icon
                        </label>
                        <WalletIconOptions
                            selectedIcon={walletData.icon}
                            onSelect={icon => setWalletData(prev => ({ ...prev, icon }))}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

export default EditWalletModal;
