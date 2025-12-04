import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wallet as WalletIcon, Shield, Loader } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

const DeleteWalletDialog = ({
    isOpen,
    onClose,
    onConfirm,
    wallet,
    otherWallets = [],
    isSystemWallet = false
}) => {
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && otherWallets.length > 0) {
            setSelectedWalletId(otherWallets[0]._id);
        } else {
            setSelectedWalletId('');
        }
    }, [isOpen, otherWallets]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            if (typeof onConfirm !== 'function') {
                throw new Error('Delete confirmation function is not available');
            }

            console.log('Deleting wallet with ID:', wallet._id);
            console.log('Transfer to wallet ID:', selectedWalletId || 'none');

            await onConfirm(wallet._id, selectedWalletId || null);
            console.log('Wallet deleted successfully');
            onClose();
        } catch (error) {
            console.error('Error deleting wallet:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const hasBalance = wallet?.balance > 0;
    const hasOtherWallets = otherWallets.length > 0;
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
            >
                <GlassCard className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        {isSystemWallet ? (
                            <Shield className="w-8 h-8 text-primary" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        )}
                        <h2 className="text-xl font-bold text-foreground">
                            {isSystemWallet ? "Protected System Wallet" : "Delete Wallet"}
                        </h2>
                    </div>

                    {isSystemWallet ? (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                This is a system wallet that contains funds from deleted accounts.
                            </p>
                            <p className="text-muted-foreground">
                                You cannot delete this wallet while it contains funds. Please transfer all funds to another wallet first.
                            </p>
                            <Button onClick={onClose} className="w-full">
                                OK
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                Are you sure you want to delete the wallet <strong className="text-foreground">{wallet?.name}</strong>?
                            </p>

                            {hasBalance && (
                                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                                    <p className="text-foreground">
                                        This wallet has a balance of <strong>{formatCurrency(wallet.balance)}</strong>
                                    </p>

                                    {hasOtherWallets ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Please select a wallet to transfer the funds to:
                                            </p>
                                            <select
                                                value={selectedWalletId}
                                                onChange={e => setSelectedWalletId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                {otherWallets.map(w => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name} ({formatCurrency(w.balance)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                            <WalletIcon className="w-5 h-5 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                A system wallet will be created to hold these funds.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="flex-1"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Delete Wallet'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default DeleteWalletDialog;
