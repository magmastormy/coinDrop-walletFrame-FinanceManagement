import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, ArrowRight, Wallet as WalletIcon, DollarSign } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const WalletTransfer = ({ sourceWallet, wallets, onClose, onTransfer }) => {
    const [formData, setFormData] = useState({
        fromWalletId: sourceWallet._id,
        toWalletId: '',
        amount: ''
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
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
    }, []);

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
        if (!amount || amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        if (parseFloat(amount) > sourceWallet.balance) {
            throw new Error('Insufficient funds in source wallet');
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
            const { fromWalletId, toWalletId, amount } = formData;
            await onTransfer(fromWalletId, toWalletId, parseFloat(amount));
            handleClose();
        } catch (error) {
            setError(error.message || 'Failed to transfer money');
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
        <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-labelledby="transfer-title"
            aria-modal="true"
            onClick={(e) => e.target.className.includes('fixed') && handleClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <GlassCard className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-6">
                        <motion.h2
                            id="transfer-title"
                            className="text-2xl font-bold text-foreground flex items-center gap-3"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <ArrowLeftRight className="w-6 h-6 text-primary" />
                            Transfer Money
                        </motion.h2>
                        <Button variant="ghost" size="icon" onClick={handleClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm"
                                role="alert"
                                aria-live="polite"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div>
                            <label htmlFor="fromWalletId" className="block text-sm font-medium text-foreground mb-2">
                                From Wallet:
                            </label>
                            <div className="relative">
                                <WalletIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <select
                                    id="fromWalletId"
                                    name="fromWalletId"
                                    value={formData.fromWalletId}
                                    onChange={handleChange}
                                    disabled
                                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground disabled:opacity-50"
                                >
                                    <option value={sourceWallet._id}>
                                        {sourceWallet.name} ({formatBalance(sourceWallet.balance)})
                                    </option>
                                </select>
                            </div>
                        </div>

                        <motion.div
                            className="flex justify-center text-muted-foreground"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <ArrowRight className="w-6 h-6" />
                        </motion.div>

                        <div>
                            <label htmlFor="toWalletId" className="block text-sm font-medium text-foreground mb-2">
                                To Wallet:
                            </label>
                            <div className="relative">
                                <WalletIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <select
                                    id="toWalletId"
                                    name="toWalletId"
                                    value={formData.toWalletId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Select Wallet</option>
                                    {wallets && wallets.filter(wallet => wallet._id !== sourceWallet._id)
                                        .map(wallet => (
                                            <option key={wallet._id} value={wallet._id}>
                                                {wallet.name} ({formatBalance(wallet.balance)})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                                Amount:
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-10"
                                />
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                Available: {formatBalance(sourceWallet.balance)}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {showConfirmation && (
                                <motion.div
                                    className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    role="alert"
                                >
                                    <h3 className="font-semibold text-foreground mb-2">Confirm Transfer</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Transfer {formatBalance(parseFloat(formData.amount))} from{' '}
                                        <strong className="text-foreground">{sourceWallet.name}</strong> to{' '}
                                        <strong className="text-foreground">{getDestinationWallet()?.name}</strong>?
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
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
                                {isLoading ? 'Transferring...' : (showConfirmation ? 'Confirm Transfer' : 'Transfer')}
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default WalletTransfer;
