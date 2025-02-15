//import data from savingsAccountManager
//handle transfer betweem savingsAccount Only
//so its from currentSavingsAccount to AnotherSavingsAccount
//Smooth rounded UI
// add a cancel button too

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        padding: theme.spacing(2),
        minWidth: '400px'
    }
}));

const StyledDialogTitle = styled(DialogTitle)({
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 600
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    width: '100%'
}));

export const SavingsAccountTransferDialog = ({
    open,
    accounts,
    sourceAccount,
    onClose,
    onTransfer
}) => {
    const [targetAccountId, setTargetAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate amount
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Check if amount exceeds source account balance
        if (numAmount > sourceAccount.balance) {
            setError('Transfer amount exceeds available balance');
            return;
        }

        // Check if target account is selected
        if (!targetAccountId) {
            setError('Please select a target account');
            return;
        }

        onTransfer(targetAccountId, numAmount);
        handleClose();
    };

    const handleClose = () => {
        setTargetAccountId('');
        setAmount('');
        setError('');
        onClose();
    };

    if (!sourceAccount) return null;

    return (
        <StyledDialog open={open} onClose={handleClose}>
            <form onSubmit={handleSubmit}>
                <StyledDialogTitle>
                    Transfer from {sourceAccount.name}
                </StyledDialogTitle>
                
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                            Available Balance: ${sourceAccount.balance.toFixed(2)}
                        </Typography>
                    </Box>

                    <StyledFormControl>
                        <InputLabel>Transfer To</InputLabel>
                        <Select
                            value={targetAccountId}
                            onChange={(e) => setTargetAccountId(e.target.value)}
                            label="Transfer To"
                            required
                        >
                            {accounts.map(account => (
                                <MenuItem key={account._id} value={account._id}>
                                    {account.name} (${account.balance.toFixed(2)})
                                </MenuItem>
                            ))}
                        </Select>
                    </StyledFormControl>

                    <StyledFormControl>
                        <TextField
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            inputProps={{
                                min: 0,
                                step: "0.01"
                            }}
                        />
                    </StyledFormControl>

                    {error && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                </DialogContent>

                <DialogActions sx={{ padding: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Transfer
                    </Button>
                </DialogActions>
            </form>
        </StyledDialog>
    );
};

export default SavingsAccountTransferDialog;