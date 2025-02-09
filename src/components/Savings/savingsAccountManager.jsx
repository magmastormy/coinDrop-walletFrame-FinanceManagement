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

const SavingsAccountManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { account: savingsAccounts = [], loading, error } = useSelector(state => state.savingsAccount);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
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
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(null);

    useEffect(() => {
        const fetchSavingsAccounts = async () => {
            if (user) {
                dispatch(setLoading(true));
                try {
                    const accounts = await savingsAccountService.getUserSavingsAccounts(user.id);
                    dispatch(setSavingsAccount(accounts));
                } catch (err) {
                    console.log("[SavingsAccountManager] Error fetching savings accounts", err);
                    dispatch(setError(err.message));
                } finally {
                    dispatch(setLoading(false));
                }
            }
        };

        fetchSavingsAccounts();
    }, [dispatch, user]);

    const handleCreateAccount = async () => {
        try {
            const accountData = {
                ...formData,
                userId: user.id,
                initialBalance: parseFloat(formData.initialBalance) || 0,
                automation: {
                    type: formData.automaticSavings?.type || 'fixed',
                    frequency: formData.automaticSavings?.frequency || 'monthly',
                    amount: parseFloat(formData.automaticSavings?.amount) || 0,
                    percentage: parseFloat(formData.automaticSavings?.percentage) || 0,
                    enabled: formData.automaticSavings?.enabled || false
                }
            };
            
            console.log("Creating savings account with data:", accountData);

            const response = await savingsAccountService.createSavingsAccount(accountData);
            dispatch(setSavingsAccount(response));
            setCreateModalOpen(false);
            setFormData({
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
            setFormData(prev => ({
                ...prev,
                automaticSavings: {
                    ...prev.automaticSavings,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
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

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            await savingsAccountService.updateTransaction(updatedTransaction);
            // Refetch the account to get updated data
            const data = await savingsAccountService.getUserSavingsAccounts(user.id);
            dispatch(setSavingsAccount(data));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleTransfer = () => {
        setShowTransferDialog(true);
    };

    const handleTransferComplete = () => {
        setShowTransferDialog(false);
    };

    const handleAccountSelect = (accountId) => {
        setSelectedAccountId(selectedAccountId === accountId ? null : accountId);
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

            <div className="savings-accounts-container">
                {savingsAccounts.map(account => (
                    <div key={account._id}>
                        <SavingsCard 
                            account={account}
                            onTransfer={() => setShowTransferDialog(true)}
                            onSelect={handleAccountSelect}
                        />
                        {selectedAccountId === account._id && (
                            <div className="transactions-section">
                                <SavingsAccountTransactionTable accountId={account._id} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        name="initialBalance"
                        label="Initial Balance"
                        type="number"
                        value={formData.initialBalance}
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
                            value={formData.automaticSavings.type}
                            onChange={handleInputChange}
                            label="Type"
                        >
                            <MenuItem value="percentage">Percentage of Income</MenuItem>
                            <MenuItem value="fixed">Fixed Amount</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <TextField
                        name="automaticSavings.amount"
                        label={formData.automaticSavings.type === 'percentage' ? 'Percentage' : 'Amount'}
                        type="number"
                        value={formData.automaticSavings.type === 'percentage' ? formData.automaticSavings.percentage : formData.automaticSavings.amount}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        InputProps={{
                            startAdornment: <span>{formData.automaticSavings.type === 'percentage' ? '%' : '$'}</span>
                        }}
                    />
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                            name="automaticSavings.frequency"
                            value={formData.automaticSavings.frequency}
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
        </motion.div>
    );
};

export default SavingsAccountManager;