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
import './styles/savingsAccountManagerStyles.css';

const SavingsAccountManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { account: savingsAccount, loading, error } = useSelector(state => state.savingsAccount);
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

    useEffect(() => {
        const fetchSavingsAccount = async () => {
            if (!user.id) return;
            
            dispatch(setLoading(true));
            try {
                const data = await savingsAccountService.getUserSavingsAccounts(user.id);
                dispatch(setSavingsAccount(data[0]));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSavingsAccount();
    }, [dispatch, user]);

    const handleCreateAccount = async () => {
        try {
            const accountData = {
                ...formData,
                userId: user.id,
                initialBalance: parseFloat(formData.initialBalance),
                automation: {
                    type: formData.automaticSavings?.type || 'fixed',
                    frequency: formData.automaticSavings?.frequency || 'monthly',
                    amount: parseFloat(formData.automaticSavings?.amount) || 0,
                    percentage: parseFloat(formData.automaticSavings?.percentage) || 0,
                    enabled: formData.automaticSavings?.enabled || false
                }
            };
            
            const response = await savingsAccountService.createSavingsAccount(accountData);
            dispatch(setSavingsAccount(response.data));
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
            dispatch(setError(err.message));
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
            dispatch(setSavingsAccount(data[0]));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            await savingsAccountService.updateTransaction(updatedTransaction);
            // Refetch the account to get updated data
            const data = await savingsAccountService.getUserSavingsAccounts(user.id);
            dispatch(setSavingsAccount(data[0]));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    if (loading) {
        return (
            <Box className="savings-account-manager loading">
                <CircularProgress />
                <Typography>Loading savings account...</Typography>
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
                    Savings Account
                </Typography>
                {!savingsAccount && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateModalOpen(true)}
                    >
                        Create Account
                    </Button>
                )}
            </Box>

            {error && (
                <Typography className="error-message" color="error">
                    {error}
                </Typography>
            )}

            {!savingsAccount ? (
                <Card className="empty-state">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            No Savings Account
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
                    </CardContent>
                </Card>
            ) : (
                <div className="account-content">
                    <Card className="account-overview">
                        <CardContent>
                            <Box className="account-header">
                                <Typography variant="h6">{savingsAccount.name}</Typography>
                                {savingsAccount.name !== 'Primary Savings' && (
                                    <IconButton
                                        onClick={() => handleDeleteAccount(savingsAccount._id)}
                                        size="small"
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                            
                            <Box className="balance-section">
                                <Typography variant="overline">Current Balance</Typography>
                                <Typography variant="h4" className="balance">
                                    ${savingsAccount.balance.toFixed(2)}
                                </Typography>
                            </Box>

                            {savingsAccount.automation?.enabled && (
                                <Box className="automatic-savings-section">
                                    <Typography variant="overline">Automatic Savings</Typography>
                                    <Typography>
                                        {savingsAccount.automation.type === 'percentage' 
                                            ? `${savingsAccount.automation.percentage}% of income` 
                                            : `$${savingsAccount.automation.amount}`}
                                        {' per '}
                                        {savingsAccount.automation.frequency}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="transactions-section">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
                            <SavingsAccountTransactionTable 
                                transactions={savingsAccount.transactions || []}
                                onUpdateTransaction={handleUpdateTransaction}
                            />
                        </CardContent>
                    </Card>
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
        </motion.div>
    );
};

export default SavingsAccountManager;