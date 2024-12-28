import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import { setWallets } from '../../slices/walletSlice';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import CreateTransactionModal from './createTransactionModal';
import TransactionList from './transactionList';
import FilterTransactions from './filterTransactions';
import CategoryPanel from '../Category/categoryPanel';
import './styles/transactionManagerStyles.css';

const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions, loading, error } = useSelector(state => state.transaction);
    const { wallets } = useSelector(state => state.wallet);
    const { user } = useSelector(state => state.auth);
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
        walletId: ''
    });

    useEffect(() => {
        Promise.all([
            fetchTransactions(),
            fetchCategories(),
            fetchWallets()
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
            // Add "None" category if it doesn't exist, temporary solution
            if (!categories.some(cat => cat.name === "None")) {
                categories.push({ _id: 'none', name: 'None' });
            }

            console.log("Fetched categories:", categories);

            setCategories(categories);
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchTransactions = async () => {
        dispatch(setLoading(true));
        try {
            if (!user?.id) {
                throw new Error('User Not Authenticated');
            }
            const data = await transactionService.getUserTransactions(user.id, filters);
            
            dispatch(setTransactions(data.transactions || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };
    const fetchWallets = async()=>{
        dispatch(setLoading(true));
        try{
            if (!user?.id)
            {
                throw new Error('User Not Authenticated');
            }
            const data = await walletService.getAllWallets(user.id);
            dispatch(setWallets(data.wallets || []));
        }catch(err)
        {
            dispatch(setError(err.message));
        } finally{
            dispatch(setLoading(false));
        }
    };

    const handleWalletSelect = (walletId) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            walletId
        }));
    };

    const handleCategorySelect = (category) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            category
        }));
    };

    const handleTransactionCreated = () => {
        fetchTransactions();
        setIsModalOpen(false);
    };

    const handleTransactionEdit = async (transaction) => {
        try {
            setEditingTransaction(transaction);
            setIsEditModalOpen(true);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditSubmit = async (updatedTransaction) => {
        try {
            dispatch(setLoading(true));
            await transactionService.updateTransaction(
                updatedTransaction._id, 
                updatedTransaction
            );
            dispatch(setLoading(false));
            setIsEditModalOpen(false);
            setEditingTransaction(null);
            fetchTransactions();
        } catch (err) {
            dispatch(setError(err.message));
            dispatch(setLoading(false));
        }
    };

    const handleTransactionDelete = async (transactionId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this transaction?')) {
                return;
            }

            dispatch(setLoading(true));

            await transactionService.deleteTransaction(transactionId);

            fetchTransactions();
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="transaction-manager">
            <h2>My Transactions</h2>
            <button onClick={() => setIsModalOpen(true)} className="create-transaction-btn">+ Create Transaction</button>
            <FilterTransactions 
                filters={filters} 
                setFilters={setFilters} 
                wallets={wallets} 
                onWalletSelect={handleWalletSelect} 
                categories={categories} 
                onCategorySelect={handleCategorySelect} 
            />
            {loading && <p>Loading transactions...</p>}
            {error && <p className="error-message">{error}</p>}
            <TransactionList 
                transactions={transactions}
                handleEdit={handleTransactionEdit}
                handleDelete={handleTransactionDelete} />
            <CreateTransactionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onTransactionCreated={handleTransactionCreated} 
                wallets={wallets} 
                categories={categories} 
            />
            <CategoryPanel categories={categories} />
            {isEditModalOpen && (
                <CreateTransactionModal 
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onTransactionCreated={handleEditSubmit}
                    wallets={wallets}
                    categories={categories}
                    initialData={editingTransaction}
                />
            )}
        </div>
    );
};

export default TransactionManager;