import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const SavingsOperations = ({
    modalState,
    setModalState,
    handleTransaction,
    selectedAccount,
    transactionAmount,
    setTransactionAmount,
    wallets,
    selectedWallet,
    setSelectedWallet
}) => {
    const handleClose = (type) => {
        setModalState(prev => ({
            ...prev,
            [type]: { ...prev[type], open: false }
        }));
        setTransactionAmount(0);
        setSelectedWallet('');
    };

    const renderTransactionDialog = (type) => {
        const isOpen = modalState[type].open;
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        const needsWallet = ['deposit', 'withdraw', 'transfer'].includes(type);
        
        return (
            <Dialog 
                open={isOpen} 
                onClose={() => handleClose(type)}
                aria-labelledby={`${type}-dialog-title`}
            >
                <DialogTitle id={`${type}-dialog-title`}>{title} Funds</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount"
                        type="number"
                        fullWidth
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        inputProps={{ min: 0 }}
                    />
                    {needsWallet && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel id={`${type}-wallet-label`}>Select Wallet</InputLabel>
                            <Select
                                labelId={`${type}-wallet-label`}
                                value={selectedWallet}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                label="Select Wallet"
                            >
                                {wallets.map((wallet) => (
                                    <MenuItem key={wallet._id} value={wallet._id}>
                                        {wallet.name} ({new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        }).format(wallet.balance)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose(type)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            handleTransaction(type, selectedAccount, transactionAmount, selectedWallet);
                            handleClose(type);
                        }}
                        disabled={!transactionAmount || (needsWallet && !selectedWallet)}
                        variant="contained"
                        color="primary"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            {renderTransactionDialog('deposit')}
            {renderTransactionDialog('withdraw')}
            {renderTransactionDialog('transfer')}
        </>
    );
};

export default SavingsOperations;
