import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import walletService from '../../services/walletService';

import CreateBudgetModal from './createBudgetModal';
import BudgetGrid from './budgetGrid';
import BudgetAnalytics from './budgetAnalytics';
import ReportSection from '../Common/ReportSection';
import CategoryManager from '../Category/categoryManager';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

const BudgetManager = () => {
    const dispatch = useDispatch();
    const { budgets, loading, error } = useSelector(state => state.budget);
    const { user } = useSelector(state => state.auth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filter, setFilter] = useState({ category: '', dateRange: '' });
    const [wallets, setWallets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('budgets');

    useEffect(() => {
        if (user?.id) {
            fetchBudgets();
            fetchCategories();
            fetchWallets();
        }
    }, [dispatch, user?.id]);

    const fetchCategories = async () => {
        try {
            const fetchedCategories = await categoryService.getUserCategories(user.id);
            setCategories(fetchedCategories);
        } catch (err) {
            console.error('[BudgetManager] Error fetching categories:', err);
        }
    };

    const fetchBudgets = async () => {
        dispatch(setLoading(true));
        try {
            const fetchedBudgets = await budgetService.getUserBudgets(user.id);
            dispatch(setBudgets(fetchedBudgets || []));
        } catch (error) {
            dispatch(setError(`Budget fetch failed: ${error.message}`));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const fetchWallets = async () => {
        try {
            const fetchedWallets = await walletService.getAllWallets(user.id);
            setWallets(fetchedWallets || []);
        } catch (err) {
            console.error('[BudgetManager] Error fetching wallets:', err);
        }
    };

    const handleBudgetSelect = async (budgetId) => {
        try {
            const budget = budgets.find(b => b._id === budgetId);
            setSelectedBudget(budget);
            setIsLoading(true);

            // Fetch budget transactions
            const transactions = await transactionService.getBudgetTransactions(budgetId);
            setTransactions(transactions?.transactions || []);
        } catch (error) {
            console.error(error);
            setTransactions([]);
            if (error?.response?.status !== 404) {
                toast.error("Failed to load budget transactions");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBudgetCreated = () => {
        fetchBudgets();
        setIsModalOpen(false);
    };

    const handleDeleteBudget = async (budgetId) => {
        try {
            await budgetService.deleteBudget(budgetId);
            fetchBudgets();
            if (selectedBudget?._id === budgetId) {
                setSelectedBudget(null);
            }
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    if (loading && !budgets.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-foreground">Budget & Category Management</h2>
                    <p className="text-muted-foreground">Track spending limits and organize expenses</p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'budgets' && (
                        <Button
                            onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create Budget
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('budgets')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'budgets'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Budgets
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'categories'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Categories
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                    {error}
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'budgets' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Budget Grid */}
                    <div className="lg:col-span-2 space-y-6">
                        <BudgetGrid
                            budgets={budgets}
                            onEdit={b => { setEditingBudget(b); setIsModalOpen(true); }}
                            onDelete={handleDeleteBudget}
                            onSelect={handleBudgetSelect}
                            selectedBudget={selectedBudget}
                            wallets={wallets}
                        />
                    </div>

                    {/* Sidebar - Analytics & Reports */}
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <ReportSection
                                title="Budget Report"
                                accountId={selectedBudget?._id || user?.id}
                                reportType="budget-performance"
                            />
                        </GlassCard>

                        {selectedBudget && (
                            <GlassCard className="p-6">
                                <h3 className="text-lg font-bold mb-4">Budget Analytics</h3>
                                <BudgetAnalytics
                                    budget={selectedBudget}
                                    transactions={transactions}
                                    filter={filter}
                                    onFilterChange={handleFilterChange}
                                />
                            </GlassCard>
                        )}
                    </div>
                </div>
            ) : (
                <CategoryManager />
            )}

            <CreateBudgetModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
                onCreateBudget={handleBudgetCreated}
                categories={categories}
                wallets={wallets}
                userId={user?.id}
                budgetData={editingBudget}
            />
        </div>
    );
};

export default BudgetManager;
