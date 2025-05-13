import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faWallet, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import './styles/deleteWalletDialogStyles.css';

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
            // Check if onConfirm is a function before calling it
            if (typeof onConfirm !== 'function') {
                throw new Error('Delete confirmation function is not available');
            }
            
            // Add additional logging to help debug
            console.log('Deleting wallet with ID:', wallet._id);
            console.log('Transfer to wallet ID:', selectedWalletId || 'none');
            
            await onConfirm(wallet._id, selectedWalletId || null);
            console.log('Wallet deleted successfully');
            onClose();
        } catch (error) {
            console.error('Error deleting wallet:', error);
            // You could add a toast notification here to show the error to the user
            // For now, we'll keep the dialog open so they can try again
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const hasBalance = wallet?.balance > 0;
    const hasOtherWallets = otherWallets.length > 0;

    return (
        <div className="delete-wallet-dialog-backdrop" onClick={onClose}>
            <motion.div 
                className="delete-wallet-dialog"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
            >
                <div className="dialog-header">
                    <FontAwesomeIcon 
                        icon={isSystemWallet ? faShieldAlt : faExclamationTriangle} 
                        className={isSystemWallet ? "system-icon" : "warning-icon"} 
                    />
                    <h2>{isSystemWallet ? "Protected System Wallet" : "Delete Wallet"}</h2>
                </div>

                {isSystemWallet ? (
                    <div className="dialog-content">
                        <p>This is a system wallet that contains funds from deleted accounts.</p>
                        <p>You cannot delete this wallet while it contains funds. Please transfer all funds to another wallet first.</p>
                    </div>
                ) : (
                    <>
                        <div className="dialog-content">
                            <p>Are you sure you want to delete the wallet <strong>{wallet?.name}</strong>?</p>
                            
                            {hasBalance && (
                                <div className="balance-warning">
                                    <p>This wallet has a balance of <strong>{new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(wallet.balance)}</strong></p>
                                    
                                    {hasOtherWallets ? (
                                        <div className="transfer-section">
                                            <p>Please select a wallet to transfer the funds to:</p>
                                            <select 
                                                value={selectedWalletId} 
                                                onChange={e => setSelectedWalletId(e.target.value)}
                                                className="wallet-select"
                                            >
                                                {otherWallets.map(w => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name} ({new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD'
                                                        }).format(w.balance)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="system-wallet-notice">
                                            <FontAwesomeIcon icon={faWallet} className="wallet-icon" />
                                            <p>A system wallet will be created to hold these funds.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="dialog-actions">
                            <button 
                                className="cancel-btn" 
                                onClick={onClose}
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button 
                                className="delete-btn" 
                                onClick={handleConfirm}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processing...' : 'Delete Wallet'}
                            </button>
                        </div>
                    </>
                )}
                
                {isSystemWallet && (
                    <div className="dialog-actions">
                        <button 
                            className="ok-btn" 
                            onClick={onClose}
                        >
                            OK
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default DeleteWalletDialog;
