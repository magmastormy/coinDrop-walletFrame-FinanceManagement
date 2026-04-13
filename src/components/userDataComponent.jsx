import { useLogger } from '../hooks/useLogger.jsx';

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

    const fetchBudgets = useCallback(async (retryCount = 0, maxRetries = 2) => {
        if (!user?.id) return;
        try {
            const data = await budgetService.getUserBudgets(user.id);
            dispatch(setBudgets(data || []));
        } catch (err) {
            logError('Failed to fetch budgets:', err);
            
            // Don't retry here - let main Promise.allSettled handle retries
            dispatch(setError(err.message));
        }
    }, [dispatch, user?.id]);

    const fetchTransactions = useCallback(async (retryCount = 0, maxRetries = 2) => {
        if (!user?.id) return;
        try {
            const data = await transactionService.getUserTransactions(user.id);
            dispatch(setTransactions((data && data.transactions) || []));
        } catch (err) {
            logError('Failed to fetch transactions:', err);
            
            // Don't retry here - let main Promise.allSettled handle retries
            dispatch(setError(err.message));
        }
    }, [dispatch, user?.id]);

    const fetchWallets = useCallback(async (retryCount = 0, maxRetries = 2) => {
        if (!user?.id) return;
        try {
            const data = await walletService.getAllWallets(user.id);
            setWalletsState(data || []);
        } catch (err) {
            logError('Failed to fetch wallets:', err);
            
            // Don't retry here - let main Promise.allSettled handle retries
            dispatch(setError(err.message));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        if (user && user.id) {
            // Set loading state at the beginning
            dispatch(setLoading(true));
            
            // Fetch all data in parallel but handle individual failures
            Promise.allSettled([
                fetchBudgets(),
                fetchTransactions(),
                fetchWallets()
            ]).then(results => {
                // Log any failures but don't crash the app
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const operations = ['budgets', 'transactions', 'wallets'];
                        logError(`Failed to fetch ${operations[index]}:`, result.reason);
                    }
                });
            }).finally(() => {
                // Set loading to false when all operations complete
                dispatch(setLoading(false));
            });
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
