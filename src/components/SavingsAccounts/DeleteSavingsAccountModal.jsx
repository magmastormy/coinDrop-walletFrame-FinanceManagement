import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import savingsAccountService from '../../services/savingsAccountService';
import { removeSavingsAccount } from '../../slices/savingsAccountSlice';
import { updateWallet } from '../../slices/walletSlice';
import { addTransaction } from '../../slices/transactionSlice';

const DeleteSavingsAccountModal = ({ show, handleClose, savingsAccount }) => {
  const dispatch = useDispatch();
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // Get user wallets from Redux store
  const wallets = useSelector(state => state.wallet.wallets);
  
  // Set default wallet if only one exists
  useEffect(() => {
    if (wallets.length === 1) {
      setSelectedWalletId(wallets[0]._id);
    }
  }, [wallets]);
  
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
  
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Savings Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete the savings account "{savingsAccount?.name}"?</p>
        
        {savingsAccount?.currentBalance > 0 && (
          <>
            <Alert variant="warning">
              This account has a balance of ${savingsAccount.currentBalance.toFixed(2)}. 
              Please select a wallet to transfer this amount to:
            </Alert>
            
            <Form.Group>
              <Form.Label>Transfer Balance to Wallet</Form.Label>
              <Form.Control 
                as="select" 
                value={selectedWalletId} 
                onChange={(e) => setSelectedWalletId(e.target.value)}
                required
              >
                <option value="">Select a wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.name} (${wallet.balance.toFixed(2)})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </>
        )}
        
        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete} 
          disabled={isDeleting || (savingsAccount?.currentBalance > 0 && !selectedWalletId)}
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteSavingsAccountModal; 