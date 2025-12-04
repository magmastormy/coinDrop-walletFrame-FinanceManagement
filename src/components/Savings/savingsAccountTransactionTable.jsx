import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setLoading, setError } from '../../slices/transactionSlice';
import savingsAccountService from '../../services/savingsAccountService';
import EditTransactionModal from './editTransactionModal';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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
        return <div className="text-center text-muted-foreground p-8">No account selected</div>;
    }

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No transactions found
                                </td>
                            </tr>
                        ) : (
                            transactions.map(transaction => (
                                <tr key={transaction._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className={cn(
                                        "py-3 px-4 text-sm font-medium",
                                        transaction.type === 'income' ? "text-emerald-400" :
                                            transaction.type === 'expense' ? "text-red-400" : "text-blue-400"
                                    )}>
                                        ${transaction.amount.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-sm capitalize">{transaction.type}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{transaction.description}</td>
                                    <td className="py-3 px-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(transaction)}
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
        </GlassCard>
    );
};

export default SavingsAccountTransactionTable;