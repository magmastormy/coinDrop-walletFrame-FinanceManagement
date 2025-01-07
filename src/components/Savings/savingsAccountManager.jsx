import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import savingsAccountService from '../../services/savingsAccountService';
import SavingsAccountTransactionTable from './savingsAccountTransactionTable';
import { setSavingsAccount, setLoading, setError } from '../../slices/savingsAccountSlice';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faTrash, faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import './styles/savingsAccountManagerStyles.css';

const SavingsAccountManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { account: savingsAccount, loading, error } = useSelector(state => state.savingsAccount);

    useEffect(() => {
        const fetchSavingsAccount = async () => {
            if (!user?.id) return;
            
            dispatch(setLoading(true));
            try {
                const data = await savingsAccountService.getUserSavingsAccounts(user.id);
                dispatch(setSavingsAccount(data[0])); // Assuming we're using the first/primary savings account
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSavingsAccount();
    }, [dispatch, user]);

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            await savingsAccountService.updateTransaction(updatedTransaction);
            // Refetch the account to get updated data
            const data = await savingsAccountService.getUserSavingsAccounts(user.id);
            dispatch(setSavingsAccount(data[0]));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!window.confirm('Are you sure you want to delete this savings account? This action cannot be undone.')) {
            return;
        }

        try {
            await savingsAccountService.deleteSavingsAccount(accountId);
            const data = await savingsAccountService.getUserSavingsAccounts(user.id);
            dispatch(setSavingsAccount(data[0]));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    if (loading) {
        return (
            <motion.div 
                className="savings-account-manager loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Loading savings account...</p>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="savings-account-manager error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                <p>Error: {error}</p>
            </motion.div>
        );
    }

    if (!savingsAccount) {
        return (
            <motion.div 
                className="savings-account-manager empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <FontAwesomeIcon icon={faPiggyBank} size="2x" />
                <p>No savings account found.</p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="savings-account-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="account-header">
                <h2>{savingsAccount.name || 'Savings Account'}</h2>
                {savingsAccount.name !== 'Savings' && (
                    <button 
                        className="delete-account-btn"
                        onClick={() => handleDeleteAccount(savingsAccount._id)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete Account
                    </button>
                )}
            </div>

            <div className="account-details">
                <div className="balance-section">
                    <h3>Current Balance</h3>
                    <p className="balance">${savingsAccount.balance.toFixed(2)}</p>
                </div>

                {savingsAccount.automaticSavings && (
                    <div className="automatic-savings-section">
                        <h3>Automatic Savings</h3>
                        <p>
                            {savingsAccount.automaticSavings.type === 'percentage' 
                                ? `${savingsAccount.automaticSavings.amount}% of income` 
                                : `$${savingsAccount.automaticSavings.amount} per ${savingsAccount.automaticSavings.frequency}`}
                        </p>
                    </div>
                )}
            </div>

            <div className="transactions-section">
                <h3>Recent Transactions</h3>
                <SavingsAccountTransactionTable 
                    transactions={savingsAccount.transactions || []}
                    onUpdateTransaction={handleUpdateTransaction}
                />
            </div>
        </motion.div>
    );
};

export default SavingsAccountManager;