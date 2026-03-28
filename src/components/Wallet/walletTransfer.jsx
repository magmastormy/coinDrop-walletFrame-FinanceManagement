import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, ArrowRight, Wallet as WalletIcon, DollarSign } from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const WalletTransfer = ({ isOpen, sourceWallet, wallets, onClose, onTransfer }) => {
    const [formData, setFormData] = useState({
        fromWalletId: sourceWallet?._id || '',
        toWalletId: '',
        amount: ''
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
        setShowConfirmation(false);
    };

    const validateForm = () => {
        const { toWalletId, amount } = formData;
        
        if (!toWalletId) {
            throw new Error('Please select a destination wallet');
        }
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        if (parseFloat(amount) > sourceWallet.balance) {
            throw new Error(`Insufficient funds (max ${formatBalance(sourceWallet.balance)})`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            validateForm();
            if (!showConfirmation) {
                setShowConfirmation(true);
                return;
            }

            setIsLoading(true);
            await onTransfer(
                formData.fromWalletId, 
                formData.toWalletId, 
                parseFloat(formData.amount)
            );
            handleClose();
        } catch (error) {
            setError(error.message || 'Failed to complete transfer');
            setShowConfirmation(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setShowConfirmation(false);
        onClose();
    };

    const getDestinationWallet = () => {
        return wallets.find(w => w._id === formData.toWalletId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Transfer Funds
                        </h2>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Source Wallet */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Wallet
                            </label>
                            <div className="relative">
                                <WalletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Select
                                    name="fromWalletId"
                                    value={formData.fromWalletId}
                                    onChange={handleChange}
                                    disabled
                                    className="pl-10"
                                >
                                    <option value={sourceWallet._id}>
                                        {sourceWallet.name} ({formatBalance(sourceWallet.balance)})
                                    </option>
                                </Select>
                            </div>
                        </div>

                        {/* Arrow Animation */}
                        <div className="flex justify-center py-2">
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Destination Wallet */}
                        <div>
<label htmlFor="toWalletId" className="block text-sm font-medium text-gray-700 mb-1">
    To Wallet
</label>
                            <div className="relative">
                                <WalletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Select
                                    name="toWalletId"
                                    value={formData.toWalletId}
                                    onChange={handleChange}
                                    required
                                    className="pl-10"
                                >
                                    <option value="">Select Destination Wallet</option>
                                    {wallets
                                        .filter(w => w._id !== sourceWallet._id)
                                        .map(wallet => (
                                            <option key={wallet._id} value={wallet._id}>
                                                {wallet.name} ({formatBalance(wallet.balance)})
                                            </option>
                                        ))
                                    }
                                </Select>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    className="pl-10"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Available: {formatBalance(sourceWallet.balance)}
                            </p>
                        </div>

                        {/* Confirmation */}
                        <AnimatePresence>
                            {showConfirmation && (
                                <motion.div
                                    className="bg-blue-50 border border-blue-100 rounded-md p-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <h3 className="font-medium text-gray-900 mb-1">Confirm Transfer</h3>
                                    <p className="text-sm text-gray-600">
                                        Transfer {formatBalance(formData.amount)} from {sourceWallet.name} to {getDestinationWallet()?.name}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Processing...' : 
                                 showConfirmation ? 'Confirm Transfer' : 'Review Transfer'}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default WalletTransfer;
