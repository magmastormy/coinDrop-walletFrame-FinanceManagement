import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wallet as WalletIcon, Shield, Loader } from 'lucide-react';
import Button from '../ui/Button';
import { Select } from '../ui/Select';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

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
    
    const formatCurrency = useCurrencyFormatter();

    useEffect(() => {
        if (isOpen && otherWallets.length > 0) {
            setSelectedWalletId(otherWallets[0]._id);
        }
    }, [isOpen, otherWallets]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm(wallet._id, selectedWalletId || null);
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const hasBalance = wallet?.balance > 0;
    const hasOtherWallets = otherWallets.length > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-gray-200 p-4 flex items-center gap-3">
                    {isSystemWallet ? (
                        <Shield className="w-5 h-5 text-blue-600" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isSystemWallet ? "Protected Wallet" : "Delete Wallet"}
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isSystemWallet ? (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                This is a protected system wallet that contains funds from deleted accounts.
                            </p>
                            <p className="text-gray-600">
                                To delete this wallet, first transfer all funds to another wallet.
                            </p>
                            <Button 
                                onClick={onClose}
                                className="w-full mt-4"
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Are you sure you want to permanently delete <span className="font-medium text-gray-900">&quot;{wallet?.name}&quot;</span>?
                            </p>

                            {hasBalance && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                                    <p className="font-medium text-yellow-800">
                                        This wallet contains {formatCurrency(wallet.balance)}
                                    </p>

                                    {hasOtherWallets ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Transfer funds to:
                                            </label>
                                            <Select
                                                value={selectedWalletId}
                                                onChange={e => setSelectedWalletId(e.target.value)}
                                            >
                                                {otherWallets.map(w => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name} ({formatCurrency(w.balance)})
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-md">
                                            <WalletIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-600">
                                                Funds will be moved to a system wallet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="flex-1"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Wallet'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteWalletDialog;
