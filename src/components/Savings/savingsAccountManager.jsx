import React, { useState, useEffect } from 'react';
import { Grid, Box, Paper, Button, Typography, Modal, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import SavingsAccountCard from './savingsAccountCard';
import SavingsOperations from './SavingsOperations';
import SavingsAccountEditDialog from './savingsAccountEditDialog';
import { SavingsAccountTransferDialog } from './savingsAccountTransferDialog';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import SavingsAnalytics from './SavingsAnalytics';
import savingsAccountService from '../../services/savingsAccountService';
import walletService from '../../services/walletService';
import { motion } from 'framer-motion';
import './styles/savingsAccountManagerStyles.css';
import ReportSection from '../Common/ReportSection';

const SavingsAccountManager = () => {
    const { user } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const [accounts, setAccounts] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createAccountOpen, setCreateAccountOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [transferWalletId, setTransferWalletId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const [modalState, setModalState] = useState({
        deposit: { open: false },
        withdraw: { open: false },
        edit: { open: false },
        transfer: { open: false }
    });

    useEffect(() => {
        if (user?.id) {
            fetchAccounts();
            fetchWallets();
        }
    }, [user]);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await savingsAccountService.getUserSavingsAccounts(user.id);
            setAccounts(response || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            setError('Failed to load savings accounts. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const response = await walletService.getAllWallets(user.id);
            setWallets(response || []);
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
            setError('Failed to load wallets. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = () => {
        setCreateAccountOpen(true);
    };

    const handleDeposit = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            deposit: { open: true }
        }));
    };

    const handleWithdraw = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            withdraw: { open: true }
        }));
    };

    const handleEdit = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            edit: { open: true }
        }));
    };

    const handleTransfer = (accountId) => {
        setSelectedAccount(accountId);
        setModalState(prev => ({
            ...prev,
            transfer: { open: true }
        }));
    };

    const handleDelete = (accountId) => {
        const account = accounts.find(acc => acc._id === accountId);
        setAccountToDelete(account);
        
        // Default to first wallet or empty string, ensuring it's not undefined
        setTransferWalletId(wallets.length > 0 ? wallets[0]._id : '');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;
        
        try {
            setIsDeleting(true);
            setDeleteError('');
            
            // Enhanced validation to handle zero-balance accounts
            const hasBalance = accountToDelete.balance > 0;
            
            if (hasBalance && !transferWalletId) {
                setDeleteError('Please select a wallet to transfer the remaining balance');
                setIsDeleting(false);
                return;
            }
            
            // Only pass the wallet ID if there's a balance to transfer
            const walletIdToUse = hasBalance ? transferWalletId : null;
            
            console.log(`Deleting account with ID: ${accountToDelete._id}, transferring to wallet: ${walletIdToUse || 'none'}`);
            
            await savingsAccountService.deleteSavingsAccount(
                accountToDelete._id, 
                walletIdToUse
            );
            
            setAccounts(prevAccounts => 
                prevAccounts.filter(account => account._id !== accountToDelete._id)
            );
            
            if (hasBalance && walletIdToUse) {
                await fetchWallets();
            }
            
            setDeleteModalOpen(false);
            setAccountToDelete(null);
            setTransferWalletId('');
            setDeleteError('');
            
        } catch (error) {
            console.error('Failed to delete account:', error);
            setDeleteError('Failed to delete the account. Please try again later.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTransaction = async (type, accountId, amount, walletId) => {
        try {
            if (type === 'deposit') {
                await savingsAccountService.depositToSavings({
                    accountId,
                    walletId,
                    amount: Number(amount)
                });
            } else {
                await savingsAccountService.withdrawFromSavings({
                    accountId,
                    walletId,
                    amount: Number(amount)
                });
            }

            await Promise.all([fetchAccounts(), fetchWallets()]);
            setModalState(prev => ({
                ...prev,
                [type]: { open: false }
            }));
        } catch (error) {
            console.error('Transaction failed:', error);
            setError('Transaction failed. Please try again later.');
        }
    };

    const handleCardSelect = (accountId) => {
        setSelectedAccount(prev => prev === accountId ? null : accountId);
    };

    const renderDeleteModal = () => {
        if (!accountToDelete) return null;
        
        return (
            <Modal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                aria-labelledby="delete-savings-account-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2
                }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Delete Savings Account
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to delete the savings account "{accountToDelete.name}"?
                    </Typography>
                    
                    {accountToDelete.balance > 0 && (
                        <>
                            <Box sx={{ 
                                bgcolor: 'warning.light', 
                                color: 'warning.contrastText',
                                p: 2,
                                borderRadius: 1,
                                mb: 2 
                            }}>
                                <Typography variant="body2">
                                    This account has a balance of ${accountToDelete.balance.toFixed(2)}. 
                                    Please select a wallet to transfer this amount to:
                                </Typography>
                            </Box>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="transfer-wallet-label">Transfer Balance to Wallet</InputLabel>
                                <Select
                                    labelId="transfer-wallet-label"
                                    id="transfer-wallet-select"
                                    value={transferWalletId}
                                    label="Transfer Balance to Wallet"
                                    onChange={(e) => setTransferWalletId(e.target.value)}
                                    required
                                >
                                    <MenuItem value="">
                                        <em>Select a wallet</em>
                                    </MenuItem>
                                    {wallets.map(wallet => (
                                        <MenuItem key={wallet._id} value={wallet._id}>
                                            {wallet.name} (${wallet.balance.toFixed(2)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    )}
                    
                    {deleteError && (
                        <Box sx={{ 
                            bgcolor: 'error.light', 
                            color: 'error.contrastText',
                            p: 2,
                            borderRadius: 1,
                            mb: 2 
                        }}>
                            <Typography variant="body2">{deleteError}</Typography>
                        </Box>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                            disabled={isDeleting || (accountToDelete.balance > 0 && !transferWalletId)}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }

    return (
        <div 
            className="savings-account-manager"
        >
            <ReportSection 
                title="Savings Accounts Report" 
                accountId={selectedAccount || user?.id} 
                reportType="savings-report"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Your Savings Accounts
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateAccount}
                >
                    Create Account
                </Button>
            </Box>
            <SavingsAnalytics accounts={accounts} />
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {accounts.map(account => (
                    <Grid item xs={12} sm={6} md={4} key={account._id}>
                        <SavingsAccountCard
                            account={account}
                            onDeposit={handleDeposit}
                            onWithdraw={handleWithdraw}
                            onEdit={handleEdit}
                            onTransfer={handleTransfer}
                            onDelete={handleDelete}
                            onSelect={handleCardSelect}
                            isSelected={selectedAccount === account._id}
                        />
                    </Grid>
                ))}
            </Grid>

            {selectedAccount && (
                <Box 
                    component={motion.div}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    sx={{ mb: 4 }}
                >
                    <SavingsAccountTransactionTable 
                        accountId={selectedAccount}
                    />
                </Box>
            )}

            <SavingsOperations
                modalState={modalState}
                setModalState={setModalState}
                handleTransaction={handleTransaction}
                selectedAccount={selectedAccount}
                transactionAmount={transactionAmount}
                setTransactionAmount={setTransactionAmount}
                wallets={wallets}
                selectedWallet={selectedWallet}
                setSelectedWallet={setSelectedWallet}
            />

            <SavingsAccountEditDialog
                open={modalState.edit.open}
                account={accounts.find(a => a._id === selectedAccount)}
                onClose={() => setModalState(prev => ({ ...prev, edit: { open: false } }))}
                onSave={async (updatedAccount) => {
                    try {
                        await savingsAccountService.updateSavingsAccount(selectedAccount, updatedAccount);
                        await fetchAccounts();
                        setModalState(prev => ({ ...prev, edit: { open: false } }));
                    } catch (error) {
                        console.error('Failed to update account:', error);
                        setError('Failed to update the account. Please try again later.');
                    }
                }}
            />

            <SavingsAccountTransferDialog
                open={modalState.transfer.open}
                accounts={accounts.filter(a => a._id !== selectedAccount)}
                sourceAccount={accounts.find(a => a._id === selectedAccount)}
                onClose={() => setModalState(prev => ({ ...prev, transfer: { open: false } }))}
                onTransfer={async (targetAccountId, amount) => {
                    try {
                        await savingsAccountService.transferBetweenSavings({
                            fromAccountId: selectedAccount,
                            toAccountId: targetAccountId,
                            amount: Number(amount)
                        });

                        await fetchAccounts();
                        setModalState(prev => ({ ...prev, transfer: { open: false } }));
                    } catch (error) {
                        console.error('Transfer failed:', error);
                        setError('Transfer failed. Please try again later.');
                    }
                }}
            />

            <SavingsAccountEditDialog
                open={createAccountOpen}
                account={null}
                onClose={() => setCreateAccountOpen(false)}
                onSave={async (newAccount) => {
                    try {
                        await savingsAccountService.createSavingsAccount(newAccount);
                        await fetchAccounts();
                        setCreateAccountOpen(false);
                    } catch (error) {
                        console.error('Failed to create account:', error);
                        setError('Failed to create the account. Please try again later.');
                    }
                }}
                isNewAccount={true}
            />

            {renderDeleteModal()}
        </div>
    );
};

export default SavingsAccountManager;