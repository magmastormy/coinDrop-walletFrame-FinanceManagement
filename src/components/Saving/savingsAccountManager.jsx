import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import savingsAccountService from '../../services/savingsAccountService';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import { setSavingsAccounts, setLoading, setError } from '../../slices/savingsAccountSlice';

const SavingsAccountManager = () => {
    const dispatch = useDispatch();
    const savingsAccounts = useSelector(state => state.savingsAccount.savingsAccounts);
    const loading = useSelector(state => state.savingsAccount.loading);
    const error = useSelector(state => state.savingsAccount.error);

    useEffect(() => {
        const fetchSavingsAccounts = async () => {
            dispatch(setLoading(true));
            try {
                const data = await savingsAccountService.getUserSavingsAccounts();
                dispatch(setSavingsAccounts(data));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSavingsAccounts();
    }, [dispatch]);

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            await savingsAccountService.updateTransaction(updatedTransaction);
            // Optionally, refetch or update the state to reflect changes
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <div>
            <h2>Savings Accounts</h2>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {savingsAccounts.map(account => (
                <div key={account._id}>
                    <h3>{account.name}</h3>
                    <SavingsAccountTransactionTable
                        transactions={account.transactions}
                        onUpdateTransaction={handleUpdateTransaction}
                    />
                </div>
            ))}
        </div>
    );
};

export default SavingsAccountManager;