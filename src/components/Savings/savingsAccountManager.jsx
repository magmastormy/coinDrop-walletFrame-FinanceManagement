import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    Button, 
    Card, 
    CardContent, 
    Typography, 
    IconButton, 
    Box,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import savingsAccountService from '../../services/savingsAccountService';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import { setSavingsAccount, setLoading, setError } from '../../slices/savingsAccountSlice';
import SavingsCard from './savingsAccountCard';
import TransferDialog from './TransferDialog';
import './styles/savingsAccountManagerStyles.css';
import { fetchWallets, setWallets } from '../../slices/walletSlice';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';

const SavingsAccountManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { account: savingsAccounts = [], loading, error } = useSelector(state => state.savingsAccount);
    const { wallets = [] } = useSelector(state => state.wallet);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [selectedAccountForTransaction, setSelectedAccountForTransaction] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [formState, setFormState] = useState({
        name: '',
        initialBalance: '',
        automaticSavings: {
            enabled: false,
            type: 'fixed',
            amount: '',
            percentage: '',
            frequency: 'monthly'
        }
    });
    const [selectedAccount, setSelectedAccount] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    dispatch(setLoading(true));

                    const accounts = await savingsAccountService.getUserSavingsAccounts(user.id);
                    const wallets = await walletService.getAllWallets(user.id);
                    console.log("SavingsAccountManager - fetchData - savingsaccounts:", accounts);
                    console.log("SavingsAccountManager - fetchData - wallets:", wallets);
                    
                    dispatch(setSavingsAccount(accounts));
                    dispatch(setWallets(wallets.wallets));
                    
                } catch (err) {
                    console.error("Error loading data:", err);
                    dispatch(setError(err.message));
                } finally {
                    dispatch(setLoading(false));
                }
            }
        };

        fetchData();
    }, [dispatch, user]);

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchWallets(user.id));
        }
    }, [dispatch, user]);

    const handleCreateAccount = async () => {
        try {
            const accountData = {
                ...formState,
                userId: user.id,
                initialBalance: parseFloat(formState.initialBalance) || 0,
                automation: {
                    type: formState.automaticSavings?.type || 'fixed',
                    frequency: formState.automaticSavings?.frequency || 'monthly',
                    amount: parseFloat(formState.automaticSavings?.amount) || 0,
                    percentage: parseFloat(formState.automaticSavings?.percentage) || 0,
                    enabled: formState.automaticSavings?.enabled || false
                }
            };
            
            console.log("Creating savings account with data:", accountData);

            const response = await savingsAccountService.createSavingsAccount(accountData);
            dispatch(setSavingsAccount(response));
            setCreateModalOpen(false);
            setFormState({
                name: '',
                initialBalance: '',
                automaticSavings: {
                    enabled: false,
                    type: 'fixed',
                    amount: '',
                    percentage: '',
                    frequency: 'monthly'
                }
            });
        } catch (err) {
            console.error("[SavingsAccountManager] Error creating savings account:", err);
            if (err.response && err.response.data) {
                dispatch(setError(err.response.data.message || "An error occurred while creating the account."));
            } else {
                dispatch(setError(err.message || "An unknown error occurred."));
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('automaticSavings.')) {
            const field = name.split('.')[1];
            setFormState(prev => ({
                ...prev,
                automaticSavings: {
                    ...prev.automaticSavings,
                    [field]: value
                }
            }));
        } else {
            setFormState(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!window.confirm('Are you sure you want to delete this savings account? This action cannot be undone.')) {
            return;
        }

        try {
            await savingsAccountService.deleteSavingsAccount(accountId);
            const data = await savingsAccountService.getUserSavingsAccounts(user.id);
            dispatch(setSavingsAccount(data));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleTransferComplete = () => {
        setShowTransferDialog(false);
    };

    const handleAccountSelect = (accountId) => {
        setSelectedAccountId(selectedAccountId === accountId ? null : accountId);
    };

    const handleDeposit = async (accountId) => {
        if (wallets.length === 0) {
            dispatch(setError('No wallets available for deposit'));
            return;
        }
        try {
            await savingsAccountService.depositToSavings({
                accountId,
                walletId: selectedWallet,
                amount: transactionAmount
            });
            // Refresh accounts after deposit
            dispatch(fetchWallets(user.id));
            setDepositModalOpen(false);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleWithdraw = async (accountId) => {
        if (wallets.length === 0) {
            dispatch(setError('No wallets available for withdrawal'));
            return;
        }
        try {
            await savingsAccountService.withdrawFromSavings({
                accountId,
                walletId: selectedWallet,
                amount: transactionAmount
            });
            // Refresh accounts after withdraw
            dispatch(fetchWallets(user.id));
            setWithdrawModalOpen(false);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleCreateTransaction = async (accountId, transactionData) => {
        try {
            await savingsAccountService.createSavingsTransaction({
                accountId,
                ...transactionData
            });
            // Refresh accounts after transaction
            dispatch(fetchWallets(user.id));
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    if (loading) {
        return (
            <Box className="savings-account-manager loading">
                <CircularProgress />
                <Typography>Loading savings accounts...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="savings-account-manager error">
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (savingsAccounts.length === 0) {
        return (
            <Box className="savings-account-manager empty">
                <Typography variant="h6" gutterBottom>
                    No Savings Accounts
                </Typography>
                <Typography color="textSecondary" paragraph>
                    Create a savings account to start managing your savings and setting up automatic savings rules.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create Savings Account
                </Button>
            </Box>
        );
    }

    return (
        <motion.div 
            className="savings-account-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box className="header">
                <Typography variant="h4" component="h1">
                    Savings Accounts
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create Savings Account
                </Button>
            </Box>

            {wallets.length === 0 && (
                <div className="no-wallets-warning">
                    <p>No wallets found. Please create a wallet first to manage savings accounts.</p>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => navigate('/wallets')}
                    >
                        Create Wallet
                    </Button>
                </div>
            )}
            
            {wallets.length > 0 && (
                <div className="savings-accounts-container">
                    {savingsAccounts.map(account => (
                        <div key={account._id}>
                            <SavingsCard 
                                account={account}
                                onTransfer={() => setShowTransferDialog(true)}
                                onSelect={handleAccountSelect}
                                onDeposit={() => {
                                    setSelectedAccountForTransaction(account._id);
                                    setDepositModalOpen(true);
                                }}
                                onWithdraw={() => {
                                    setSelectedAccountForTransaction(account._id);
                                    setWithdrawModalOpen(true);
                                }}
                            />
                            {selectedAccountId === account._id && (
                                <div className="transactions-section">
                                    <SavingsAccountTransactionTable accountId={account._id} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Dialog 
                open={isCreateModalOpen} 
                onClose={() => setCreateModalOpen(false)}
                className="create-account-dialog"
            >
                <DialogTitle>Create Savings Account</DialogTitle>
                <DialogContent>
                    <TextField
                        name="name"
                        label="Account Name"
                        value={formState.name}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        name="initialBalance"
                        label="Initial Balance"
                        type="number"
                        value={formState.initialBalance}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        InputProps={{
                            startAdornment: <span>$</span>
                        }}
                    />
                    
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Automatic Savings Rules (Optional)
                    </Typography>
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Type</InputLabel>
                        <Select
                            name="automaticSavings.type"
                            value={formState.automaticSavings.type}
                            onChange={handleInputChange}
                            label="Type"
                        >
                            <MenuItem value="percentage">Percentage of Income</MenuItem>
                            <MenuItem value="fixed">Fixed Amount</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <TextField
                        name="automaticSavings.amount"
                        label={formState.automaticSavings.type === 'percentage' ? 'Percentage' : 'Amount'}
                        type="number"
                        value={formState.automaticSavings.type === 'percentage' ? formState.automaticSavings.percentage : formState.automaticSavings.amount}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        InputProps={{
                            startAdornment: <span>{formState.automaticSavings.type === 'percentage' ? '%' : '$'}</span>
                        }}
                    />
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                            name="automaticSavings.frequency"
                            value={formState.automaticSavings.frequency}
                            onChange={handleInputChange}
                            label="Frequency"
                        >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateAccount} variant="contained" color="primary">
                        Create Account
                    </Button>
                </DialogActions>
            </Dialog>

            {showTransferDialog && (
                <TransferDialog
                    open={showTransferDialog}
                    onClose={() => setShowTransferDialog(false)}
                    onComplete={handleTransferComplete}
                />
            )}

            {isDepositModalOpen && (
                <Dialog open={isDepositModalOpen} onClose={() => setDepositModalOpen(false)}>
                    <DialogTitle>Deposit to Savings</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Amount"
                            type="number"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Select Wallet</InputLabel>
                            <Select
                                value={selectedWallet || ''}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                label="Select Wallet"
                            >
                                {wallets.map(wallet => (
                                    <MenuItem 
                                        key={wallet._id} 
                                        value={wallet._id}
                                    >
                                        {wallet.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDepositModalOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={() => handleDeposit(selectedAccountForTransaction)} 
                            variant="contained" 
                            color="primary"
                        >
                            Deposit
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {isWithdrawModalOpen && (
                <Dialog open={isWithdrawModalOpen} onClose={() => setWithdrawModalOpen(false)}>
                    <DialogTitle>Withdraw from Savings</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Amount"
                            type="number"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Select Wallet</InputLabel>
                            <Select
                                value={selectedWallet || ''}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                label="Select Wallet"
                            >
                                {wallets.map(wallet => (
                                    <MenuItem 
                                        key={wallet._id} 
                                        value={wallet._id}
                                    >
                                        {wallet.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={() => handleWithdraw(selectedAccountForTransaction)} 
                            variant="contained" 
                            color="primary"
                        >
                            Withdraw
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </motion.div>
    );
};

export default SavingsAccountManager;