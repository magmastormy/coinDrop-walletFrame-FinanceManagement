import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import WalletIconOptions from './newWalletIcons';
import walletService from '../../services/walletService';
import { updateWallet } from '../../slices/walletSlice';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const EditWalletModal = ({ isOpen, wallet, onClose, onUpdate }) => {
    const dispatch = useDispatch();
    const [walletData, setWalletData] = useState({
        name: wallet?.name || '',
        type: wallet?.type || 'bank',
        balance: wallet?.balance || '',
        icon: wallet?.icon || 'Wallet'
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const balance = parseFloat(walletData.balance);
            
            if (isNaN(balance)) {
                throw new Error('Please enter a valid balance');
            }
            if (!walletData.name.trim()) {
                throw new Error('Wallet name cannot be empty');
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Wallet</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Wallet Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wallet Name
                            </label>
                            <Input
                                type="text"
                                value={walletData.name}
                                onChange={e => setWalletData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                required
                                placeholder="e.g. Main Account"
                            />
                        </div>

                        {/* Wallet Balance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Balance
                            </label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={walletData.balance}
                                onChange={e => setWalletData(prev => ({
                                    ...prev,
                                    balance: e.target.value
                                }))}
                                required
                                placeholder="0.00"
                            />
                        </div>

                        {/* Wallet Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wallet Type
                            </label>
                            <Select
                                value={walletData.type}
                                onChange={e => setWalletData(prev => ({
                                    ...prev,
                                    type: e.target.value
                                }))}
                            >
                                <option value="bank">Bank Account</option>
                                <option value="cash">Cash</option>
                                <option value="credit">Credit Card</option>
                                <option value="savings">Savings</option>
                                <option value="investment">Investment</option>
                                <option value="loan">Loan</option>
                                <option value="other">Other</option>
                            </Select>
                        </div>

                        {/* Wallet Icon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wallet Icon
                            </label>
                            <WalletIconOptions
                                selectedIcon={walletData.icon}
                                onSelect={icon => setWalletData(prev => ({ 
                                    ...prev, 
                                    icon 
                                }))}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditWalletModal;
