import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import { setWallets } from '../../slices/walletSlice';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import savingsAccountService from '../../services/savingsAccountService';
import CreateTransactionModal from './createTransactionModal';
import TransactionList from './transactionList';
import FilterTransactions from './filterTransactions';
import CategoryPanel from '../Category/categoryPanel';
import './styles/transactionManagerStyles.css';

const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions, loading, error } = useSelector(state => state.transaction || {});
    const { user } = useSelector(state => state.auth || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [wallets, setLocalWallets] = useState([]);
    const [filters, setFilters] = useState({
        minAmount: '',
        maxAmount: '',
        category: '',
        wallet: '',
        startDate: '',
        endDate: '',
        type: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, [user]);

    const fetchInitialData = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            // Fetch wallets directly
            const walletsResponse = await walletService.getUserWallets(user.id);
            setLocalWallets(walletsResponse.data);
            
            // Fetch categories
            const categoriesData = await categoryService.getUserCategories(user.id);
            setCategories(categoriesData);
            
            // Fetch transactions
            const transactionsData = await transactionService.getUserTransactions(user.id);
            dispatch(setTransactions(transactionsData));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleTransactionCreated = () => {
        setIsModalOpen(false);
        fetchInitialData();
    };

    const handleEditSubmit = async (updatedTransaction) => {
        try {
            await transactionService.updateTransaction(updatedTransaction._id, updatedTransaction);
            fetchInitialData();
            setIsEditModalOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleTransactionDelete = async (transactionId) => {
        try {
            await transactionService.deleteTransaction(transactionId);
            fetchInitialData();
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    };

    const handleDeleteTransaction = (transactionId) => {
        handleTransactionDelete(transactionId);
    };

    const handleCreateTransaction = () => {
        handleTransactionCreated();
    };

    const handleUpdateTransaction = (updatedTransaction) => {
        handleEditSubmit(updatedTransaction);
    };

    const filteredTransactions = transactions.filter((transaction) => {
        return (
            (filters.minAmount === '' || transaction.amount >= filters.minAmount) &&
            (filters.maxAmount === '' || transaction.amount <= filters.maxAmount) &&
            (filters.category === '' || transaction.category === filters.category) &&
            (filters.wallet === '' || transaction.wallet === filters.wallet) &&
            (filters.startDate === '' || transaction.date >= filters.startDate) &&
            (filters.endDate === '' || transaction.date <= filters.endDate) &&
            (filters.type === '' || transaction.type === filters.type)
        );
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="transaction-manager">
            <div className="transaction-header">
                <h2>Transactions</h2>
                <button 
                    onClick={() => {
                        setEditingTransaction(null);
                        setIsModalOpen(true);
                    }}
                    className="create-transaction-btn"
                >
                    Create Transaction
                </button>
            </div>

            <FilterTransactions 
                filters={filters} 
                onFilterChange={handleFilterChange}
                categories={categories}
                wallets={wallets}
            />

            {error && <div className="error-message">{error}</div>}

            <TransactionList 
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                loading={loading}
                wallets={wallets}
                categories={categories}
            />

            {(isModalOpen || isEditModalOpen) && (
                <CreateTransactionModal
                    onClose={() => {
                        setIsModalOpen(false);
                        setIsEditModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onCreateTransaction={handleCreateTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    transaction={editingTransaction}
                    wallets={wallets}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default TransactionManager;