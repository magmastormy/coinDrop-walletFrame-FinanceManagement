import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import budgetService from '../services/budgetService';
import transactionService from '../services/transactionService';
import walletService from '../services/walletService';
import { setBudgets, setTransactions, setError, setLoading } from '../slices/userDataSlice';
import DataContext from '../contexts/DataContext';

const DataManager = ({ children }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { budgets, transactions } = useSelector(state => state.userData);
    const [wallets, setWalletsState] = useState([]);

    const fetchBudgets = useCallback(async () => {
        if (!user?.id) return;
        dispatch(setLoading(true));
        try {
            const data = await budgetService.getUserBudgets(user.id);
            dispatch(setBudgets(data || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, user?.id]);

    const fetchTransactions = useCallback(async () => {
        if (!user?.id) return;
        dispatch(setLoading(true));
        try {
            const data = await transactionService.getUserTransactions(user.id);
            dispatch(setTransactions(data.transactions || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, user?.id]);

    const fetchWallets = useCallback(async () => {
        if (!user?.id) return;
        dispatch(setLoading(true));
        try {
            const data = await walletService.getAllWallets(user.id);
            setWalletsState(data || []);
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        if (user && user.id) {
            Promise.all([
                fetchBudgets(),
                fetchTransactions(),
                fetchWallets()
            ]);
        }
    }, [user, fetchBudgets, fetchTransactions, fetchWallets]);

    const contextValue = useMemo(() => ({
        budgets,
        transactions,
        wallets
    }), [budgets, transactions, wallets]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export default DataManager;
