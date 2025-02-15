import React, { useState, useEffect } from 'react';
import { Grid, ThemeProvider, createTheme, useMediaQuery, CssBaseline, Box, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
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

const SavingsAccountManager = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: prefersDarkMode ? 'dark' : 'light',
                    primary: {
                        main: '#1976d2',
                    },
                    secondary: {
                        main: '#dc004e',
                    },
                    background: {
                        default: prefersDarkMode ? '#303030' : '#f5f5f5',
                        paper: prefersDarkMode ? '#424242' : '#ffffff',
                    },
                },
                components: {
                    MuiDialog: {
                        styleOverrides: {
                            paper: {
                                width: '400px',
                                maxWidth: '90%'
                            }
                        }
                    }
                }
            }),
        [prefersDarkMode],
    );

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
            setWallets(response.wallets || []);
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
            setError('Failed to load wallets. Please try again later.');
        } finally {
            setIsLoading(false);
        }
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

    const handleDelete = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this savings account?')) {
            try {
                await savingsAccountService.deleteSavingsAccount(accountId);
                setAccounts(prevAccounts => 
                    prevAccounts.filter(account => account._id !== accountId)
                );
                setSelectedAccount(null);
            } catch (error) {
                console.error('Failed to delete account:', error);
                setError('Failed to delete the account. Please try again later.');
            }
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

            // Refresh accounts and wallets after transaction
            await Promise.all([fetchAccounts(), fetchWallets()]);

            // Close the modal
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="savings-account-manager">
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
                            await fetchAccounts(); // Refresh accounts after update
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
                            // First withdraw from source account
                            await savingsAccountService.withdrawFromSavings({
                                accountId: selectedAccount,
                                amount: Number(amount)
                            });

                            // Then deposit to target account
                            await savingsAccountService.depositToSavings({
                                accountId: targetAccountId,
                                amount: Number(amount)
                            });

                            await fetchAccounts(); // Refresh accounts after transfer
                            setModalState(prev => ({ ...prev, transfer: { open: false } }));
                        } catch (error) {
                            console.error('Transfer failed:', error);
                            setError('Transfer failed. Please try again later.');
                        }
                    }}
                />
            </div>
        </ThemeProvider>
    );
};

export default SavingsAccountManager;