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
    const { wallets } = useSelector(state => state.wallet || {});
    const savingsAccount = useSelector(state => state.savingsAccount?.account);
    const { user } = useSelector(state => state.auth || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        minAmount: '',
        maxAmount: '',
        category: '',
        startDate: '',
        endDate: '',
        walletId: '',
        source: '' // 'wallet' or 'savings'
    });

    useEffect(() => {
        Promise.all([
            fetchTransactions(),
            fetchCategories(),
            fetchWallets(),
            fetchSavingsAccount()
        ]).catch(err => {
            console.error("Error Fetching initial data");
            dispatch(setError(err.message));
        });
    }, [dispatch, filters]);

    const fetchCategories = async () => {
        dispatch(setLoading(true));
        try {
            if (!user?.id) {
                throw new Error('User Not Authenticated');
            }
            const fetchedCategories = await categoryService.getUserCategories(user.id);
            const categories = Array.isArray(fetchedCategories) ? fetchedCategories : [];
            setCategories(categories);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const fetchTransactions = async () => {
        dispatch(setLoading(true));
        try {
            if (!user?.id) {
                throw new Error('User Not Authenticated');
            }
            const allTransactions = await transactionService.getAllUserTransactions(user.id, filters);
            dispatch(setTransactions(allTransactions));
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const fetchWallets = async () => {
        try {
            if (!user?.id) {
                throw new Error('User Not Authenticated');
            }
            const response = await walletService.getAllWallets(user.id);
            dispatch(setWallets(response));
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const fetchSavingsAccount = async () => {
        try {
            if (!user?.id) {
                throw new Error('User Not Authenticated');
            }
            await savingsAccountService.getSavingsAccount(user.id);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleTransactionCreated = () => {
        setIsModalOpen(false);
        fetchTransactions();
        fetchWallets();
        fetchSavingsAccount();
    };

    const handleEditSubmit = async (updatedTransaction) => {
        try {
            await transactionService.updateTransaction(updatedTransaction._id, updatedTransaction);
            fetchTransactions();
            fetchWallets();
            fetchSavingsAccount();
            setIsEditModalOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleTransactionDelete = async (transactionId) => {
        try {
            await transactionService.deleteTransaction(transactionId);
            fetchTransactions();
            fetchWallets();
            fetchSavingsAccount();
        } catch (error) {
            dispatch(setError(error.message));
        }
    };

    const handleWalletSelect = (walletId) => {
        setFilters(prev => ({
            ...prev,
            walletId,
            source: 'wallet'
        }));
    };

    const handleSavingsSelect = () => {
        setFilters(prev => ({
            ...prev,
            walletId: '',
            source: 'savings'
        }));
    };

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
                    onClick={() => setIsModalOpen(true)}
                    className="new-transaction-button"
                >
                    New Transaction
                </button>
            </div>

            <FilterTransactions
                filters={filters}
                setFilters={setFilters}
                wallets={wallets}
                onWalletSelect={handleWalletSelect}
                onSavingsSelect={handleSavingsSelect}
                categories={categories}
                onCategorySelect={(category) => setFilters(prev => ({ ...prev, category }))}
            />

            <div className="transaction-content">
                <div className="transaction-list">
                    <TransactionList
                        transactions={transactions}
                        onEdit={(transaction) => {
                            setEditingTransaction(transaction);
                            setIsEditModalOpen(true);
                        }}
                        onDelete={handleTransactionDelete}
                    />
                </div>
                <CategoryPanel transactions={transactions} categories={categories} />
            </div>

            {isModalOpen && (
                <CreateTransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onTransactionCreated={handleTransactionCreated}
                    wallets={wallets}
                    categories={categories}
                    savingsAccount={savingsAccount}
                />
            )}

            {isEditModalOpen && editingTransaction && (
                <CreateTransactionModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onTransactionCreated={handleTransactionCreated}
                    wallets={wallets}
                    categories={categories}
                    savingsAccount={savingsAccount}
                    initialData={editingTransaction}
                />
            )}
        </div>
    );
};

export default TransactionManager;