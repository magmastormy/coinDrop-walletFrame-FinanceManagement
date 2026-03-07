import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import budgetService from '../services/budgetService';
import transactionService from '../services/transactionService';
import walletService from '../services/walletService';
import { setBudgets, setTransactions, setError, setLoading } from '../slices/userDataSlice';

const DataManager = ({ children }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [budgets, setBudgetsState] = useState([]);
    const [transactions, setTransactionsState] = useState([]);
    const [wallets, setWalletsState] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            fetchBudgets();
            fetchTransactions();
            fetchWallets();
        }
    }, [user]);

    const fetchBudgets = async () => {
        dispatch(setLoading(true));
        try {
            const data = await budgetService.getUserBudgets(user.id);
            setBudgetsState(data || []);
            dispatch(setBudgets(data || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchTransactions = async () => {
        dispatch(setLoading(true));
        try {
            const data = await transactionService.getUserTransactions(user.id);
            setTransactionsState(data.transactions || []);
            dispatch(setTransactions(data.transactions || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchWallets = async () => {
        dispatch(setLoading(true));
        try {
            const data = await walletService.getAllWallets(user.id);
            setWalletsState(data || []);
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <DataContext.Provider value={{ budgets, transactions, wallets }}>
            {children}
        </DataContext.Provider>
    );
};

export const DataContext = React.createContext();
export default DataManager;
