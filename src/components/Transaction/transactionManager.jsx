import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import walletService from '../../services/walletService';
import savingsAccountService from '../../services/savingsAccountService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import CreateTransactionModal from './createTransactionModal';
import TransactionList from './transactionList';
import FilterTransactions from './filterTransactions';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import './styles/transactionManagerStyles.css';

/**
 * TransactionManager Component
 * 
 * Manages the display and operations of transactions including:
 * - Fetching and displaying transactions
 * - Creating new transactions
 * - Filtering transactions
 * - Managing transaction-related state
 */
const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions = [], loading, error } = useSelector(state => state.transaction || {});
    const { user } = useSelector(state => state.auth || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState([]);
    const [wallets, setLocalWallets] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);
    const [filters, setFilters] = useState({
        minAmount: '',
        maxAmount: '',
        category: '',
        walletId: '',
        savingsAccount: '',
        startDate: '',
        endDate: '',
        type: ''
    });

    useEffect(() => {
        if (user?.id) {
            fetchInitialData();
        }
    }, [user]);

    /**
     * Fetches all initial data required for the transaction manager
     * Including transactions, wallets, and categories
     */
    const fetchInitialData = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            // Fetch wallets
            const walletsResponse = await walletService.getAllWallets(user.id);
            console.log('[transactionManagerManager] fetchInitialData walletsResponse', walletsResponse);
            setLocalWallets(walletsResponse.wallets || []);

            //Fetch Savings Accounts
            const savingsAccountsResponse = await savingsAccountService.getUserSavingsAccounts(user.id);
            console.log('[transactionManagerManager] fetchInitialData savingsAccountsResponse', savingsAccountsResponse);
            setSavingsAccounts(savingsAccountsResponse.accounts || []);
            
            // Fetch categories
            const categoriesData = await categoryService.getUserCategories(user.id);
            setCategories(categoriesData || []);
            
            // Fetch transactions
            const transactionsResponse = await transactionService.getUserTransactions(user.id, filters);
            dispatch(setTransactions(transactionsResponse || []));
        } catch (err) {
            console.error('Error fetching initial data:', err);
            dispatch(setError('Unable to fetch transaction data. Please try again later.'));
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
            console.error('Error creating transaction:', err);
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
            console.error('Error updating transaction:', err);
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
        console.log("Selected Wallet ID:", walletId);
        setFilters(prev => ({ ...prev, walletId }));
    };

    const handleSavingsSelect = () => {
        console.log("Selected Savings Account");
        setFilters(prev => ({ ...prev, savingsAccount: null }));
    };

    const handleCategorySelect = (category) => {
        console.log("Selected Category:", category);
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

    // Filter transactions based on current filters
    const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
        return (
            (!filters.minAmount || transaction.amount >= parseFloat(filters.minAmount)) &&
            (!filters.maxAmount || transaction.amount <= parseFloat(filters.maxAmount)) &&
            (!filters.category || transaction.category === filters.category) &&
            (!filters.walletId || transaction.wallet === filters.walletId) &&
            (!filters.startDate || new Date(transaction.date) >= new Date(filters.startDate)) &&
            (!filters.endDate || new Date(transaction.date) <= new Date(filters.endDate)) &&
            (!filters.type || transaction.type === filters.type)
        );
    }) : [];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="transaction-manager">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Transactions
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setEditingTransaction(null);
                        setIsModalOpen(true);
                    }}
                >
                    New Transaction
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <FilterTransactions 
                filters={filters}
                setFilters={setFilters}
                wallets={wallets}
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
                    categories={categories}
                    wallets={wallets}
                />
            )}

            {(isModalOpen || editingTransaction) && (
                <CreateTransactionModal
                    open={isModalOpen || !!editingTransaction}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onSubmit={editingTransaction ? 
                        (data) => handleUpdateTransaction(editingTransaction._id, data) : 
                        handleCreateTransaction}
                    transaction={editingTransaction}
                    categories={categories}
                    wallets={wallets}
                />
            )}
        </div>
    );
};

export default TransactionManager;