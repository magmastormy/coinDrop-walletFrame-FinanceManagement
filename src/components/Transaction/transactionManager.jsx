import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import transactionService from '../../services/transactionService';
import CreateTransactionModal from './createTransactionModal';
import TransactionList from './transactionList';
import FilterTransactions from './filterTransactions';
import './styles/transactionStyles.css';


const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions, loading, error } = useSelector(state => state.transaction);
    const { wallets } = useSelector(state => state.wallet);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        minAmount: '',
        maxAmount: '',
        category: '',
        startDate: '',
        endDate: '',
        walletId: ''
    });

    useEffect(() => {
        fetchTransactions();
    }, [dispatch, filters]);

    const fetchTransactions = async () => {
        dispatch(setLoading(true));
        try {
            const data = await transactionService.getUserTransactions(filters);
            dispatch(setTransactions(data.transactions || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleWalletSelect = (walletId) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            walletId
        }));
    };

    const handleTransactionCreated = () => {
        fetchTransactions();
        setIsModalOpen(false);
    };

    return (
        <div className="transaction-manager">
            <h2>My Transactions</h2>
            <button onClick={() => setIsModalOpen(true)} className="create-transaction-btn">+ Create Transaction</button>
            <FilterTransactions filters={filters} setFilters={setFilters} wallets={wallets} onWalletSelect={handleWalletSelect} />
            {loading && <p>Loading transactions...</p>}
            {error && <p className="error-message">{error}</p>}
            <TransactionList transactions={transactions} />
            <CreateTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTransactionCreated={handleTransactionCreated} wallets={wallets} />
        </div>
    );
};

export default TransactionManager;