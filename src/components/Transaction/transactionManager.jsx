import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import walletService from '../../services/walletService';
import savingsAccountService from '../../services/savingsAccountService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import budgetService from '../../services/budgetService';
import CreateTransactionModal from './createTransactionModal';
import TransactionList from './transactionList';
import FilterTransactions from './filterTransactions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '../../theme/ThemeContext';
import './styles/transactionManagerStyles.css';

const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions = [], loading, error } = useSelector(state => state.transaction || {});
    const { user } = useSelector(state => state.auth || {});
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState([]);
    const [wallets, setLocalWallets] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        if (user?.id) {
            fetchInitialData();
            fetchBudgets();
        }
    }, [user]);

    const fetchInitialData = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            // Fetch wallets
            const walletsResponse = await walletService.getAllWallets(user.id);
            setLocalWallets(walletsResponse || []);

            //Fetch Savings Accounts
            const savingsAccountsResponse = await savingsAccountService.getUserSavingsAccounts(user.id);
            setSavingsAccounts(savingsAccountsResponse || []);
            
            // Fetch categories
            const categoriesData = await categoryService.getUserCategories(user.id);
            setCategories(categoriesData || []);
            
            // Fetch transactions
            const transactionsResponse = await transactionService.getUserTransactions(user.id, filters);
            dispatch(setTransactions(transactionsResponse.transactions || []));
        } catch (err) {
            dispatch(setError('Unable to fetch transaction data. Please try again later.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchBudgets = async () => {
        dispatch(setLoading(true));
        try {
            const budgetsResponse = await budgetService.getUserBudgets(user.id);
            setBudgets(budgetsResponse.budgets || []);
        } catch (err) {
            console.error('Error fetching budgets:', err);
            dispatch(setError('Unable to fetch budgets. Please try again later.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleCreateTransaction = async (transactionData) => {
        dispatch(setLoading(true));
        try {
            await transactionService.createTransaction({
                ...transactionData,
                userId: user.id
            });
            setIsModalOpen(false);
            await fetchInitialData();
        } catch (err) {
            dispatch(setError('Failed to create transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateTransaction = async (transactionId, updatedData) => {
        dispatch(setLoading(true));
        try {
            await transactionService.updateTransaction(transactionId, updatedData);
            setEditingTransaction(null);
            await fetchInitialData();
        } catch (err) {
            dispatch(setError('Failed to update transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        dispatch(setLoading(true));
        try {
            await transactionService.deleteTransaction(transactionId);
            await fetchInitialData();
        } catch (err) {
            dispatch(setError('Failed to delete transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchInitialData();
    };

    const handleWalletSelect = (walletId) => {
        setFilters(prev => ({ 
            ...prev, 
            walletId: walletId._id || walletId 
        }));
    };

    const handleSavingsSelect = (savingsAccountId) => {
        setFilters(prev => ({ ...prev, savingsAccountId }));
    };

    const handleCategorySelect = (category) => {
        setFilters(prev => ({ ...prev, category }));
    };

    const handleTransfer = async (fromWalletId, toWalletId, amount) => {
        try {
            await walletService.transferFunds(fromWalletId, toWalletId, amount);
            await fetchInitialData();
        } catch (err) {
            console.error('Error during transfer:', err);
            dispatch(setError('Failed to transfer funds. Please try again.'));
        }
    };

    const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
        return (
            (!filters.category || transaction.category === filters.category) &&
            (!filters.walletId || (transaction.walletId && transaction.walletId._id === filters.walletId)) &&
            (!filters.savingsAccountId || transaction.savingsAccount === filters.savingsAccountId) &&
            (!filters.startDate || new Date(transaction.date) >= new Date(filters.startDate)) &&
            (!filters.endDate || new Date(transaction.date) <= new Date(filters.endDate)) &&
            (!filters.type || transaction.type === filters.type)
        );
    }) : [];


    const data = React.useMemo(() =>
        Array.isArray(transactions) ? transactions : [],
        [transactions]
    );

    // Summary stats for displayed transactions
    const totalIncome = filteredTransactions.reduce((sum, tx) => tx.type === 'income' ? sum + tx.amount : sum, 0);
    const totalExpense = filteredTransactions.reduce((sum, tx) => tx.type === 'expense' ? sum + tx.amount : sum, 0);
    const net = totalIncome - totalExpense;

    if (loading) {
        return (
            <Box className="loading-container">
                <CircularProgress className="progress-indicator" />
            </Box>
        );
    }

    return (
        <div className="transaction-manager">
            <Box className="header-section">
                <Typography variant="h5" className="page-title">
                    Transactions
                </Typography>
            </Box>
            <Box className="summary-section" sx={{ mb: 3 }}>
                <Card>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <Box textAlign="center">
                            <Typography variant="subtitle1">Income</Typography>
                            <Typography variant="h6">${totalIncome.toFixed(2)}</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="subtitle1">Expense</Typography>
                            <Typography variant="h6">${totalExpense.toFixed(2)}</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="subtitle1">Net</Typography>
                            <Typography variant="h6">${net.toFixed(2)}</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setEditingTransaction(null);
                                setIsModalOpen(true);
                            }}
                            sx={{ height: 40 }}
                        >
                            New Transaction
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {error && (
                <Box className="error-container">
                    <Alert severity="error" className="error-alert">
                        {error}
                    </Alert>
                </Box>
            )}

            <FilterTransactions 
                filters={filters}
                setFilters={setFilters}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
                onWalletSelect={handleWalletSelect}
                onSavingsSelect={handleSavingsSelect}
                categories={categories}
                onCategorySelect={handleCategorySelect}
            />

            {!loading && filteredTransactions.length === 0 ? (
                <Box textAlign="center" my={4}>
                    <Typography variant="body1" color="text.secondary">
                        No transactions found. Create a new transaction to get started!
                    </Typography>
                </Box>
            ) : (
                <TransactionList 
                    transactions={filteredTransactions}
                    onEdit={setEditingTransaction}
                    onDelete={handleDeleteTransaction}
                    wallets={wallets}
                    savingsAccounts={savingsAccounts}
                />
            )}

            {(isModalOpen || editingTransaction) && (
                <CreateTransactionModal
                    isOpen={isModalOpen || !!editingTransaction}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onTransactionCreated={editingTransaction ? 
                        (data) => handleUpdateTransaction(editingTransaction._id, data) : 
                        handleCreateTransaction}
                    initialData={editingTransaction}
                    categories={categories}
                    wallets={wallets}
                    budgets={budgets}
                    savingsAccounts={savingsAccounts}
                />
            )}
        </div>
    );
};

export default TransactionManager;