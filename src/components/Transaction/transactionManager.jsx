import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, ArrowDownLeft, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import walletService from '../../services/walletService';
import savingsAccountService from '../../services/savingsAccountService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import budgetService from '../../services/budgetService';
import CreateTransactionModal from './createTransactionModal';
import TransactionTable from './transactionTable';
import FilterTransactions from './filterTransactions';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions = [], loading, error } = useSelector(state => state.transaction || {});
    const { user } = useSelector(state => state.auth || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState([]);
    const [wallets, setLocalWallets] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        if (user?.id) {
            fetchInitialData();
            fetchBudgets();
        }
    }, [user]);

    const fetchInitialData = async () => {
        if (!user?.id) return;
        dispatch(setLoading(true));
        try {
            const [walletsRes, savingsRes, categoriesRes, transactionsRes] = await Promise.all([
                walletService.getAllWallets(user.id),
                savingsAccountService.getUserSavingsAccounts(user.id),
                categoryService.getUserCategories(user.id),
                transactionService.getUserTransactions(user.id, { ...filters, limit: 1000 })
            ]);

            setLocalWallets(walletsRes || []);
            setSavingsAccounts(savingsRes || []);
            setCategories(categoriesRes || []);

            let txs = [];
            if (transactionsRes?.data?.transactions) txs = transactionsRes.data.transactions;
            else if (Array.isArray(transactionsRes?.data)) txs = transactionsRes.data;
            else if (Array.isArray(transactionsRes?.transactions)) txs = transactionsRes.transactions;

            dispatch(setTransactions(txs));
        } catch (err) {
            dispatch(setError('Unable to fetch transaction data.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchBudgets = async () => {
        try {
            const res = await budgetService.getUserBudgets(user.id);
            setBudgets(res.budgets || []);
        } catch (err) {
            console.error('Error fetching budgets:', err);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        try {
            await transactionService.deleteTransaction(transactionId);
            fetchInitialData();
            fetchBudgets();
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!Array.isArray(transactions)) return [];

        return transactions.filter(t => {
            const categoryMatch = !filters.category || t.category === filters.category || t.category?._id === filters.category;
            const walletMatch = !filters.walletId || t.walletId === filters.walletId || t.walletId?._id === filters.walletId;
            const savingsMatch = !filters.savingsAccountId || t.savingsAccountId === filters.savingsAccountId || t.savingsAccountId?._id === filters.savingsAccountId;
            const startDateMatch = !filters.startDate || new Date(t.date) >= new Date(filters.startDate);
            const endDateMatch = !filters.endDate || new Date(t.date) <= new Date(filters.endDate);

            return categoryMatch && walletMatch && savingsMatch && startDateMatch && endDateMatch;
        });
    }, [transactions, filters]);

    const stats = useMemo(() => {
        const income = filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
        const expense = filteredTransactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    if (loading && !transactions.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-foreground">Transactions</h2>
                    <p className="text-muted-foreground">Track your income and expenses</p>
                </div>
                <Button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> New Transaction
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Income</p>
                        <p className="text-2xl font-bold text-emerald-500">${stats.income.toFixed(2)}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                        <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Expense</p>
                        <p className="text-2xl font-bold text-red-500">${stats.expense.toFixed(2)}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Net Balance</p>
                        <p className="text-2xl font-bold text-foreground">${stats.net.toFixed(2)}</p>
                    </div>
                </GlassCard>
            </div>

            <FilterTransactions
                filters={filters}
                setFilters={setFilters}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
                categories={categories}
            />

            <TransactionTable
                transactions={filteredTransactions}
                onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
                onDelete={handleDeleteTransaction}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
            />

            <CreateTransactionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
                onTransactionCreated={() => { fetchInitialData(); fetchBudgets(); }}
                initialData={editingTransaction}
                categories={categories}
                wallets={wallets}
                budgets={budgets}
                savingsAccounts={savingsAccounts}
            />
        </div>
    );
};

export default TransactionManager;