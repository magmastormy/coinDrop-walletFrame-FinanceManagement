import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import BulkEditToolbar from './bulkEditToolbar';
import { setTransactions, setLoading, setError } from '../../slices/transactionSlice';
import walletService from '../../services/walletService';
import savingsAccountService from '../../services/savingsAccountService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import budgetService from '../../services/budgetService';
import CreateTransactionModal from './createTransactionModal';
import CsvImportModal from './csvImportModal';
import TransactionTable from './transactionTable';
import FilterTransactions from './filterTransactions';
import LoadingState from '../ui/LoadingState';

const TransactionManager = () => {
    const dispatch = useDispatch();
    const { transactions = [], loading } = useSelector(state => state.transaction || {});
    const { user } = useSelector(state => state.auth || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState([]);
    const [wallets, setLocalWallets] = useState([]);
    const [savingsAccounts, setSavingsAccounts] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [filters, setFilters] = useState({
        dateRange: 'month',
        categories: [],
        amountRange: { min: null, max: null },
        searchQuery: '',
        type: 'all'
    });
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [bulkEditMode, setBulkEditMode] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchInitialData();
            fetchBudgets();
        }
    }, [user, fetchInitialData, fetchBudgets]);

    const fetchInitialData = useCallback(async () => {
        if (!user?.id) return;
        dispatch(setLoading(true));
        try {
            // Use Promise.allSettled to handle individual failures gracefully
            const results = await Promise.allSettled([
                walletService.getAllWallets(user.id),
                savingsAccountService.getUserSavingsAccounts(user.id),
                categoryService.getUserCategories(user.id),
                transactionService.getUserTransactions(user.id, { ...filters, limit: 1000 })
            ]);

            // Extract successful results
            const walletsRes = results[0].status === 'fulfilled' ? results[0].value : [];
            const savingsRes = results[1].status === 'fulfilled' ? results[1].value : [];
            const categoriesRes = results[2].status === 'fulfilled' ? results[2].value : [];
            const transactionsRes = results[3].status === 'fulfilled' ? results[3].value : { transactions: [] };

            // Log any failures but continue with successful data
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const operations = ['wallets', 'savings accounts', 'categories', 'transactions'];
                    logError(`Failed to fetch ${operations[index]}:`, result.reason);
                }
            });

            setLocalWallets(walletsRes || []);
            setSavingsAccounts(savingsRes || []);
            setCategories(categoriesRes || []);
            dispatch(setTransactions(transactionsRes?.transactions || []));
        } catch (err) {
            dispatch(setError('Unable to fetch transaction data.'));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, user?.id, filters]);

    const fetchBudgets = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await budgetService.getUserBudgets(user.id);
            setBudgets(res || []);
        } catch (err) {
            logError('Error fetching budgets:', err);
            toast.error('Failed to load budgets. Please try again.');
        }
    }, [user?.id]);

    const handleDeleteTransaction = async (transactionId) => {
        try {
            await transactionService.deleteTransaction(transactionId);
            fetchInitialData();
            fetchBudgets();
        } catch (err) {
            logError('Error deleting transaction:', err);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await transactionService.bulkDelete(selectedTransactions);
            setSelectedTransactions([]);
            setBulkEditMode(false);
            fetchInitialData();
            fetchBudgets();
        } catch (err) {
            logError('Error bulk deleting transactions:', err);
        }
    };

    const handleBulkCategoryUpdate = async (categoryId) => {
        try {
            await transactionService.bulkUpdate(selectedTransactions, { category: categoryId });
            setSelectedTransactions([]);
            setBulkEditMode(false);
            fetchInitialData();
        } catch (err) {
            logError('Error bulk updating transactions:', err);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!Array.isArray(transactions)) return [];

        return transactions.filter(t => {
            const categoryMatch = !filters.category || t.category === filters.category || t.category?._id === filters.category;
            const walletMatch = !filters.walletId || t.walletId === filters.walletId || t.walletId?._id === filters.walletId;
            const savingsMatch = !filters.savingsAccountId || t.savingsAccountId === filters.savingsAccountId || t.savingsAccountId?._id === filters.savingsAccountId;
            
            // Validate dates before comparison
            const transactionDate = t.date ? new Date(t.date) : null;
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            
            // Check if dates are valid before comparing
            const isValidTransactionDate = transactionDate && !isNaN(transactionDate.getTime());
            const isValidStartDate = startDate && !isNaN(startDate.getTime());
            const isValidEndDate = endDate && !isNaN(endDate.getTime());
            
            const startDateMatch = !filters.startDate || (!isValidStartDate || (isValidTransactionDate && transactionDate >= startDate));
            const endDateMatch = !filters.endDate || (!isValidEndDate || (isValidTransactionDate && transactionDate <= endDate));

            return categoryMatch && walletMatch && savingsMatch && startDateMatch && endDateMatch;
        });
    }, [transactions, filters]);

    const stats = useMemo(() => {
        const income = filteredTransactions.reduce((sum, t) => {
            const amount = typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0;
            return t.type === 'income' ? sum + amount : sum;
        }, 0);
        const expense = filteredTransactions.reduce((sum, t) => {
            const amount = typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0;
            return t.type === 'expense' ? sum + amount : sum;
        }, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    const handleResetFilters = () => {
        setFilters({
            dateRange: 'month',
            categories: [],
            amountRange: { min: null, max: null },
            searchQuery: '',
            type: 'all',
            category: '',
            walletId: '',
            savingsAccountId: '',
            startDate: '',
            endDate: ''
        });
    };

    const handleCsvImportComplete = () => {
        fetchInitialData();
        fetchBudgets();
        setIsCsvImportModalOpen(false);
    };

    if (loading && !transactions.length) {
        return <LoadingState loading={loading} height="md" />;
    }

    return (
        <div className="p-10 space-y-12 max-w-7xl mx-auto w-full font-body">
            {/* Summary Stats: Editorial Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Income Card */}
                <div className="glass-card p-8 relative overflow-hidden group">
                    <div 
                        className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors duration-500"
                        style={{ 
                            backgroundColor: 'var(--color-success-100)',
                        }}
                    />
                    <p className="font-medium text-sm mb-2 tracking-wide uppercase" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                        Total Income
                    </p>
                    <h2 className="text-4xl font-headline font-extrabold tracking-tight" style={{ color: 'var(--fc-on-surface)' }}>
                        ${stats.income.toFixed(2)}
                    </h2>
                    <div className="mt-4 flex items-center text-xs font-semibold" style={{ color: 'var(--fc-secondary-fixed)' }}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>0% from last month</span>
                    </div>
                </div>

                {/* Total Expense Card */}
                <div className="glass-card p-8 relative overflow-hidden group">
                    <div 
                        className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors duration-500"
                        style={{ 
                            backgroundColor: 'var(--color-error-100)',
                        }}
                    />
                    <p className="font-medium text-sm mb-2 tracking-wide uppercase" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                        Total Expense
                    </p>
                    <h2 className="text-4xl font-headline font-extrabold tracking-tight" style={{ color: 'var(--fc-on-surface)' }}>
                        ${stats.expense.toFixed(2)}
                    </h2>
                    <div className="mt-4 flex items-center text-xs font-semibold" style={{ color: 'var(--fc-error)' }}>
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span>0% from last month</span>
                    </div>
                </div>

                {/* Net Balance Card */}
                <div className="glass-card p-8 relative overflow-hidden group" style={{ borderLeft: '4px solid var(--fc-primary)' }}>
                    <div 
                        className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors duration-500"
                        style={{ 
                            backgroundColor: 'var(--color-primary-100)'
                        }}
                    />
                    <p className="font-medium text-sm mb-2 tracking-wide uppercase" style={{ color: 'var(--fc-on-tertiary-container)' }}>
                        Net Balance
                    </p>
                    <h2 className="text-4xl font-headline font-extrabold tracking-tight" style={{ color: 'var(--fc-on-surface)' }}>
                        ${stats.net.toFixed(2)}
                    </h2>
                    <div className="mt-4 flex items-center text-xs font-semibold" style={{ color: 'var(--fc-tertiary)' }}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>Status: Stable</span>
                    </div>
                </div>
            </section>

            {/* Filters & Controls Section */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <FilterTransactions
                        filters={filters}
                        setFilters={setFilters}
                        wallets={wallets}
                        savingsAccounts={savingsAccounts}
                        categories={categories}
                    />
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setBulkEditMode(!bulkEditMode)}
                            className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-colors"
                            style={{ 
                                backgroundColor: bulkEditMode ? 'var(--fc-primary)' : 'var(--fc-surface-container-highest)',
                                color: bulkEditMode ? 'var(--fc-on-primary)' : 'var(--fc-on-surface)',
                                border: '1px solid var(--fc-outline-variant)'
                            }}
                        >
                            <span>{bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}</span>
                        </button>
                        
                        <button
                            onClick={handleResetFilters}
                            className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-colors hover:bg-surface-bright"
                            style={{ 
                                backgroundColor: 'var(--fc-surface-container-highest)',
                                color: 'var(--fc-on-surface)',
                                border: '1px solid var(--fc-outline-variant)'
                            }}
                        >
                            <span className="material-symbols-outlined text-lg">filter_list</span>
                            <span>Reset Filters</span>
                        </button>
                        
                        <button
                            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                            className="cta-gradient px-6 py-3 rounded-xl font-bold flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Transaction</span>
                        </button>
                    </div>
                </div>
                
                {bulkEditMode && (
                    <BulkEditToolbar
                        selectedCount={selectedTransactions.length}
                        onCategoryChange={(categoryId) => handleBulkCategoryUpdate(categoryId)}
                        onDelete={() => handleBulkDelete()}
                        onCancel={() => {
                            setBulkEditMode(false);
                            setSelectedTransactions([]);
                        }}
                        categories={categories}
                    />
                )}
            </section>

            {/* Main Data Table Container */}
            <TransactionTable
                transactions={filteredTransactions}
                onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
                onDelete={handleDeleteTransaction}
                wallets={wallets}
                savingsAccounts={savingsAccounts}
                bulkEditMode={bulkEditMode}
                selectedTransactions={selectedTransactions}
                onSelectTransaction={(id, selected) => {
                    setSelectedTransactions(prev => 
                        selected 
                            ? [...prev, id] 
                            : prev.filter(tId => tId !== id)
                    );
                }}
                onSelectAll={(selected) => {
                    setSelectedTransactions(selected ? filteredTransactions.map(t => t._id) : []);
                }}
                onAddTransaction={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                onImportCsv={() => setIsCsvImportModalOpen(true)}
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

            <CsvImportModal
                isOpen={isCsvImportModalOpen}
                onClose={() => setIsCsvImportModalOpen(false)}
                onImportComplete={handleCsvImportComplete}
            />
        </div>
    );
};

export default TransactionManager;
