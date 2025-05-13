import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setError } from '../../slices/transactionSlice';
import savingsAccountService from '../../services/savingsAccountService';
import EditTransactionModal from './editTransactionModal';
import './styles/savingsTransactionTableStyles.css';

const SavingsAccountTransactionTable = ({ accountId, wallets = [], savingsAccounts = [], budgets = [], categories = [] }) => {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (accountId) {
                dispatch(setLoading(true));
                try {
                    const account = await savingsAccountService.getSavingsAccount(accountId);
                    setTransactions(account.transactions || []);
                } catch (err) {
                    console.error('Error fetching transactions:', err);
                    dispatch(setError('Unable to fetch transactions. Please try again later.'));
                } finally {
                    dispatch(setLoading(false));
                }
            }
        };

        fetchTransactions();
    }, [accountId, dispatch]);

    const handleEditClick = (transaction) => {
        setSelectedTransaction(transaction);
        setEditModalOpen(true);
    };

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            dispatch(setLoading(true));
            await savingsAccountService.updateTransaction(accountId, updatedTransaction);
            setTransactions(prev => prev.map(t => 
                t._id === updatedTransaction._id ? updatedTransaction : t
            ));
            setEditModalOpen(false);
        } catch (err) {
            console.error('Error updating transaction:', err);
            dispatch(setError('Failed to update transaction. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    if (!accountId) {
        return <div className="no-account-selected">No account selected</div>;
    }

    return (
        <div className="transaction-table-container">
            <div className="transaction-grid-header">
                <div>Date</div>
                <div>Amount</div>
                <div>Type</div>
                <div>Description</div>
                <div>Actions</div>
            </div>
            
            {transactions.length === 0 ? (
                <div className="no-transactions">No transactions found</div>
            ) : (
                transactions.map(transaction => (
                    <div className="transaction-grid-row" key={transaction._id}>
                        <div>{new Date(transaction.date).toLocaleDateString()}</div>
                        <div className={`amount ${transaction.type.toLowerCase()}`}>
                            ${transaction.amount.toFixed(2)}
                        </div>
                        <div>{transaction.type}</div>
                        <div>{transaction.description}</div>
                        <div>
                            <button 
                                className="edit-button"
                                onClick={() => handleEditClick(transaction)}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ))
            )}

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                transaction={selectedTransaction}
                onUpdate={handleUpdateTransaction}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
                budgets={budgets}
                categories={categories}
            />
        </div>
    );
};

export default SavingsAccountTransactionTable;