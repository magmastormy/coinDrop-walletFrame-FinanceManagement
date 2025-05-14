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
import '../shared/componentScrollFix.css';

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
            
            // Fetch transactions - set a high limit to get all transactions
            const transactionsResponse = await transactionService.getUserTransactions(user.id, { ...filters, limit: 1000 });
            
            // Log the full response to debug
            console.log('Transaction response:', transactionsResponse);
            
            // Extract transactions from the response
            let transactions = [];
            
            if (transactionsResponse) {
                if (transactionsResponse.data) {
                    // Most common case: transactions are in response.data.transactions
                    if (transactionsResponse.data.transactions && Array.isArray(transactionsResponse.data.transactions)) {
                        transactions = transactionsResponse.data.transactions;
                    }
                    // Case: transactions are directly in response.data as an array
                    else if (Array.isArray(transactionsResponse.data)) {
                        transactions = transactionsResponse.data;
                    }
                }
                // Case: transactions are directly in the response
                else if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
                    transactions = transactionsResponse.transactions;
                }
            }
            
            console.log(`Fetched ${transactions.length} transactions from database:`, transactions);
            dispatch(setTransactions(transactions));
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
        // Validate transaction data
        if (!transactionData || typeof transactionData !== 'object') {
            console.error('Invalid transaction data received:', transactionData);
            dispatch(setError('Invalid transaction data. Please try again.'));
            return;
        }

        // Check if it's already a response object (prevent double processing)
        if (transactionData.message && transactionData.transaction) {
            console.log('Received response object instead of transaction data, skipping create');
            setIsModalOpen(false);
            await fetchInitialData();
            await fetchBudgets();
            return;
        }

        dispatch(setLoading(true));
        try {
            console.log('Creating transaction with data:', transactionData);
            await transactionService.createTransaction(transactionData);
            console.log('Transaction created successfully');
            
            // Close modal and refresh data
            setIsModalOpen(false);
            
            // Force a complete refresh of data
            setTimeout(async () => {
                await fetchInitialData();
                await fetchBudgets();
                console.log('Data refreshed after transaction creation');
            }, 300);
        } catch (err) {
            console.error('Transaction creation error:', err);
            dispatch(setError(err.response?.data?.message || err.message || 'Failed to create transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateTransaction = async (transactionId, updatedData) => {
        // Validate transaction ID
        if (!transactionId) {
            console.error('No transaction ID provided for update');
            dispatch(setError('Transaction ID is required for updates'));
            return;
        }

        // Validate transaction data
        if (!updatedData || typeof updatedData !== 'object') {
            console.error('Invalid transaction data received for update:', updatedData);
            dispatch(setError('Invalid transaction data. Please try again.'));
            return;
        }

        // Check if it's already a response object (prevent double processing)
        if (updatedData.message && updatedData.transaction) {
            console.log('Received response object instead of transaction data, skipping update');
            setEditingTransaction(null);
            setIsModalOpen(false);
            await fetchInitialData();
            await fetchBudgets();
            return;
        }

        dispatch(setLoading(true));
        try {
            console.log('Updating transaction:', transactionId, 'with data:', updatedData);
            await transactionService.updateTransaction(transactionId, updatedData);
            console.log('Transaction updated successfully');
            
            // Reset state and close modal
            setEditingTransaction(null);
            setIsModalOpen(false);
            
            // Force a complete refresh of data with a slight delay
            setTimeout(async () => {
                await fetchInitialData();
                await fetchBudgets();
                console.log('Data refreshed after transaction update');
            }, 300);
        } catch (err) {
            console.error('Error updating transaction:', err);
            dispatch(setError(err.response?.data?.message || err.message || 'Failed to update transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        dispatch(setLoading(true));
        try {
            await transactionService.deleteTransaction(transactionId);
            // Refresh the transactions list
            await fetchInitialData();
            // Also refresh budgets to update analytics
            await fetchBudgets();
        } catch (err) {
            console.error('Error deleting transaction:', err);
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
        // Clear savings account filter when selecting a wallet
        setFilters(prev => ({ 
            ...prev, 
            walletId: walletId?._id || walletId || '',
            savingsAccountId: '' // Clear savings account filter when selecting a wallet
        }));
        
        // Refresh data with new filters
        fetchInitialData();
    };

    const handleSavingsSelect = (savingsAccountId) => {
        // Clear wallet filter when selecting a savings account
        setFilters(prev => ({ 
            ...prev, 
            savingsAccountId: savingsAccountId?._id || savingsAccountId || '',
            walletId: '' // Clear wallet filter when selecting a savings account
        }));
        
        // Refresh data with new filters
        fetchInitialData();
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

    // Apply filters to transactions with improved handling of different property formats
    const filteredTransactions = React.useMemo(() => {
        if (!Array.isArray(transactions)) return [];
        
        console.log('Filtering transactions with filters:', filters);
        console.log('Total transactions before filtering:', transactions.length);
        
        const filtered = transactions.filter(transaction => {
            // Handle category filter - could be string ID or object with _id
            const categoryMatch = !filters.category || 
                transaction.category === filters.category || 
                (transaction.category && transaction.category._id === filters.category);
            
            // Handle wallet filter - could be string ID or object with _id
            const walletMatch = !filters.walletId || filters.walletId === '' || 
                transaction.walletId === filters.walletId || 
                (transaction.walletId && transaction.walletId._id === filters.walletId) ||
                (typeof transaction.walletId === 'string' && transaction.walletId === filters.walletId);
            
            // Handle savings account filter
            const savingsMatch = !filters.savingsAccountId || filters.savingsAccountId === '' || 
                transaction.savingsAccountId === filters.savingsAccountId || 
                (transaction.savingsAccountId && transaction.savingsAccountId._id === filters.savingsAccountId) ||
                (typeof transaction.savingsAccountId === 'string' && transaction.savingsAccountId === filters.savingsAccountId);
            
            // Handle date filters
            const startDateMatch = !filters.startDate || 
                new Date(transaction.date) >= new Date(filters.startDate);
                
            const endDateMatch = !filters.endDate || 
                new Date(transaction.date) <= new Date(filters.endDate);
            
            // Handle type filter
            const typeMatch = !filters.type || transaction.type === filters.type;
            
            return categoryMatch && walletMatch && savingsMatch && startDateMatch && endDateMatch && typeMatch;
        });
        
        console.log('Filtered transactions count:', filtered.length);
        return filtered;
    }, [transactions, filters]);


    // We don't need this anymore since we're using filteredTransactions directly
    // const data = React.useMemo(() =>
    //     Array.isArray(transactions) ? transactions : [],
    //     [transactions]
    // );

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
                    onEdit={(transaction) => {
                        console.log('Editing transaction:', transaction);
                        setEditingTransaction(transaction);
                        setIsModalOpen(true);
                    }}
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