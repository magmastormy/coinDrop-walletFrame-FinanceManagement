import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import savingsAccountService from '../../services/savingsAccountService';
import { removeSavingsAccount } from '../../slices/savingsAccountSlice';
import { updateWallet } from '../../slices/walletSlice';
import { addTransaction } from '../../slices/transactionSlice';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';

const DeleteSavingsAccountModal = ({ show, handleClose, savingsAccount }) => {
  const dispatch = useDispatch();
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // Get user wallets from Redux store
  const wallets = useSelector(state => state.wallet.wallets);

  const safeWallets = useMemo(() => (Array.isArray(wallets) ? wallets : []), [wallets]);
  
  // Set default wallet if only one exists
  useEffect(() => {
    if (safeWallets.length === 1) {
      setSelectedWalletId(safeWallets[0]._id);
    }
  }, [safeWallets]);
  
  const handleDelete = async () => {
    if (!selectedWalletId) {
      setError('Please select a wallet to transfer the remaining balance');
      return;
    }
    
    try {
      setIsDeleting(true);
      setError('');
      
      const response = await savingsAccountService.deleteSavingsAccount(
        savingsAccount._id, 
        selectedWalletId
      );
      
      // Update Redux state
      dispatch(removeSavingsAccount(savingsAccount._id));
      
      // If money was transferred, update wallet balance
      if (response.transferredAmount > 0) {
        dispatch(updateWallet({
          id: selectedWalletId,
          balance: response.transferredAmount, // This will be added to the current balance
          isIncrement: true
        }));
        
        // Add the transaction to the store
        dispatch(addTransaction({
          amount: response.transferredAmount,
          type: 'transfer',
          category: 'account_closure',
          description: `Transferred from deleted savings account: ${savingsAccount.name}`,
          fromAccount: savingsAccount._id,
          toWallet: selectedWalletId,
          date: new Date().toISOString(),
        }));
      }
      
      handleClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete savings account');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const hasBalance = Number(savingsAccount?.currentBalance || 0) > 0;
  const balanceAmount = Number(savingsAccount?.currentBalance || 0);

  return (
    <Modal
      isOpen={!!show}
      onClose={handleClose}
      title="Delete Savings Account"
      className="max-w-lg"
      backdropVariant="dark"
    >
      <div className="space-y-4">
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
          Are you sure you want to delete the savings account &quot;{savingsAccount?.name}&quot;?
        </p>

        {hasBalance && (
          <div className="space-y-3">
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-2)',
                padding: '12px',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
              }}
            >
              This account has a balance of ${balanceAmount.toFixed(2)}. Please select a wallet to transfer this amount to:
            </div>

            <div className="space-y-1">
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                Transfer Balance to Wallet
              </div>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-1)',
                  padding: '0 12px',
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <option value="">Select a wallet</option>
                {safeWallets.map(wallet => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.name} (${Number(wallet.balance || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239, 68, 68, 0.10)',
              padding: '12px',
              color: 'rgba(239, 68, 68, 0.9)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting || (hasBalance && !selectedWalletId)}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSavingsAccountModal; 
