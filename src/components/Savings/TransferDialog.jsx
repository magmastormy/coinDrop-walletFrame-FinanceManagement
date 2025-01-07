import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { savingsAccountService } from '../../services/savingsAccountService';
import { setSavingsAccount, setError } from '../../slices/savingsAccountSlice';
import { updateWallet } from '../../slices/walletSlice';
import './styles/transferDialogStyles.css';

const TransferDialog = ({ open, onClose, onComplete }) => {
    const dispatch = useDispatch();
    const { account } = useSelector((state) => state.savingsAccount);
    const { wallets } = useSelector((state) => state.wallet);
    const { user } = useSelector((state) => state.auth);

    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');
    const [transferType, setTransferType] = useState('to-savings'); // 'to-savings' or 'from-savings'
    const [error, setLocalError] = useState('');

    const handleTransfer = async () => {
        try {
            if (!amount || !selectedWallet) {
                setLocalError('Please fill in all fields');
                return;
            }

            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                setLocalError('Please enter a valid amount');
                return;
            }

            const wallet = wallets.find(w => w._id === selectedWallet);
            
            if (transferType === 'to-savings' && wallet.balance < numAmount) {
                setLocalError('Insufficient funds in wallet');
                return;
            }

            if (transferType === 'from-savings' && account.balance < numAmount) {
                setLocalError('Insufficient funds in savings');
                return;
            }

            const response = transferType === 'to-savings'
                ? await savingsAccountService.transferToSavings(user._id, numAmount, selectedWallet, 'manual')
                : await savingsAccountService.withdrawFromSavings(user._id, numAmount, selectedWallet);

            dispatch(setSavingsAccount(response.savingsAccount));
            dispatch(updateWallet(response.wallet));
            
            onComplete();
            onClose();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            className="transfer-dialog"
            aria-labelledby="transfer-dialog-title"
        >
            <DialogTitle id="transfer-dialog-title">
                Transfer Money
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Transfer Type</InputLabel>
                    <Select
                        value={transferType}
                        onChange={(e) => setTransferType(e.target.value)}
                        label="Transfer Type"
                    >
                        <MenuItem value="to-savings">To Savings</MenuItem>
                        <MenuItem value="from-savings">From Savings</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Wallet</InputLabel>
                    <Select
                        value={selectedWallet}
                        onChange={(e) => setSelectedWallet(e.target.value)}
                        label="Wallet"
                    >
                        {wallets.map((wallet) => (
                            <MenuItem key={wallet._id} value={wallet._id}>
                                {wallet.name} (${wallet.balance})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={!!error}
                    helperText={error}
                    InputProps={{
                        inputProps: { 
                            min: 0,
                            step: "0.01"
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleTransfer} color="primary" variant="contained">
                    Transfer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TransferDialog;
