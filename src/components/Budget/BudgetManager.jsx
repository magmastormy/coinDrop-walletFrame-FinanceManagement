import { logError } from '../../utils/logger';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Wallet, Loader2, Home, Utensils, ShoppingBag, TrendingUp, Plane, MoreVertical, Edit, Trash2, ArrowRight, Ticket, Heart, GraduationCap, Zap, ShoppingCart, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ValidationUtils from '../../utils/validationUtils';
import { setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import walletService from '../../services/walletService';
import Card from '../ui/Card';

import CreateBudgetModal from './createBudgetModal';
import BudgetGrid from './budgetGrid';
import BudgetAnalytics from './budgetAnalytics';
import BudgetPerformanceChart from './budgetPerformanceChart';
import ReportSection from '../Common/ReportSection';
import CategoryManager from '../Category/CategoryManager';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';
import Select from '../ui/Select';
import PageHeader from '../Common/PageHeader';
import LoadingState from '../ui/LoadingState';

const BudgetManager = () => {
    const dispatch = useDispatch();
    const { budgets, loading, error } = useSelector(state => state.budget);
    const { user } = useSelector(state => state.auth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filter, setFilter] = useState({ 
        category: '', 
        dateRange: 'month',
        compareMode: false,
        forecastPeriod: 3 
    });
    const [wallets, setWallets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('budgets');
    const [showForecast, setShowForecast] = useState(false);
    const [forecastAccuracy, setForecastAccuracy] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        if (user && user.id) {
            fetchBudgets();
            fetchCategories();
            fetchWallets();
        }
    }, [dispatch, user?.id]);

    const fetchCategories = async () => {
        if (!user?.id) return;
        try {
            const fetchedCategories = await categoryService.getUserCategories(user.id);
            setCategories(fetchedCategories);
        } catch (err) {
            logError('[BudgetManager] Error fetching categories:', err);
        }
    };

    const fetchBudgets = async () => {
        if (!user?.id) return;
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
        if (!user?.id) return;
        try {
            const fetchedWallets = await walletService.getAllWallets(user.id);
            setWallets(fetchedWallets || []);
        } catch (error) {
            logError('[BudgetManager] Error fetching wallets:', error);
        }
    };

    const handleBudgetSelect = async (budgetId) => {
        try {
            const budget = (budgets || []).find(b => b?._id === budgetId);
            setSelectedBudget(budget);
            setIsLoading(true);

            // Fetch budget transactions
            const transactions = await transactionService.getBudgetTransactions(budgetId);
            setTransactions(transactions?.transactions || []);
        } catch (error) {
            logError('Error selecting budget:', error);
            setTransactions([]);
            toast.error("Failed to load budget transactions");
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

    const handleEditCategory = (category) => {
        setCategoryName(category.name);
        setEditingCategory(category);
        setDeleteConfirm(null);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (deleteConfirm === categoryId) {
            try {
                await categoryService.deleteCategory(categoryId);
                fetchCategories();
                setDeleteConfirm(null);
            } catch (err) {
                dispatch(setError(err.message));
            }
        } else {
            setDeleteConfirm(categoryId);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        
        // Validate category name
        const nameValidation = ValidationUtils.validateRequiredString(categoryName, 'Category name', 1, 50);
        if (!nameValidation.isValid) {
            dispatch(setError(nameValidation.error));
            return;
        }

        try {
            const categoryData = { name: categoryName.trim() };
            await ValidationUtils.withTimeout(
                ValidationUtils.withRetry(
                    () => categoryService.updateCategory(editingCategory._id, categoryData),
                    'updateCategory',
                    3,
                    1000
                ),
                30000
            );
            fetchCategories();
            setCategoryName('');
            setEditingCategory(null);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleCancelEdit = () => {
        setCategoryName('');
        setEditingCategory(null);
    };

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    if (loading && !budgets.length) {
        return <LoadingState loading={loading} height="md" />;
    }

    // Calculate total budget utilization
    const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpent;
    const dailyAverage = totalSpent / 30; // Assuming 30 days in a month
    const safeToSpend = remaining / (30 - new Date().getDate());

    // Calculate Efficiency Score based on budget utilization
    const calculateEfficiencyScore = () => {
        if (budgets.length === 0) return { score: 0, tier: 'Novice' };
        
        // Calculate average utilization across all budgets
        const avgUtilization = budgets.reduce((sum, budget) => {
            const budgetUtilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            return sum + budgetUtilization;
        }, 0) / budgets.length;
        
        // Calculate score (higher is better, optimized for 80-90% utilization)
        let score;
        if (avgUtilization < 60) {
            score = Math.round(avgUtilization * 1.2); // Lower utilization gets lower score
        } else if (avgUtilization >= 60 && avgUtilization <= 90) {
            score = Math.round(80 + (avgUtilization - 60) * 0.6); // Optimal range
        } else {
            score = Math.round(92 - (avgUtilization - 90) * 1.5); // Overutilization reduces score
        }
        
        // Ensure score is within 0-100 range
        score = Math.max(0, Math.min(100, score));
        
        // Determine tier based on score
        let tier;
        if (score >= 90) tier = 'Elite';
        else if (score >= 75) tier = 'Pro';
        else if (score >= 60) tier = 'Intermediate';
        else tier = 'Novice';
        
        return { score, tier };
    };

    // Get efficiency score
    const efficiencyScore = calculateEfficiencyScore();

    // Generate dynamic spending insight
    const generateSpendingInsight = () => {
        if (budgets.length === 0) {
            return "Start by creating your first budget to track your spending.";
        }
        
        // Find category with highest utilization
        const highestUtilizationCategory = budgets.reduce((max, budget) => {
            const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            return utilization > max.utilization ? { ...budget, utilization } : max;
        }, { utilization: 0 });
        
        // Find category with lowest utilization
        const lowestUtilizationCategory = budgets.reduce((min, budget) => {
            const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            return utilization < min.utilization ? { ...budget, utilization } : min;
        }, { utilization: 100 });
        
        // Generate insight based on spending patterns
        if (highestUtilizationCategory.utilization > 90) {
            return `Your spending in ${highestUtilizationCategory.name} is at ${highestUtilizationCategory.utilization.toFixed(0)}%, approaching your budget limit.`;
        } else if (lowestUtilizationCategory.utilization < 30) {
            return `You're underutilizing your budget for ${lowestUtilizationCategory.name} (only ${lowestUtilizationCategory.utilization.toFixed(0)}%). Consider reallocating funds.`;
        } else {
            return `Your spending across categories is well-balanced. Keep up the good work!`;
        }
    };

    // Get dynamic spending insight
    const spendingInsight = generateSpendingInsight();

    // Map actual budget data to category grid format
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            'Housing & Utility': <Home />,
            'Dining & Lifestyle': <Utensils />,
            'Shopping & Retail': <ShoppingBag />,
            'Investments': <TrendingUp />,
            'Travel & Transport': <Plane />,
            'Entertainment': <Ticket />,
            'Healthcare': <Heart />,
            'Education': <GraduationCap />,
            'Utilities': <Zap />,
            'Groceries': <ShoppingCart />
        };
        return iconMap[categoryName] || <Wallet />;
    };

    const getCategoryColor = (index) => {
        const colors = ['primary', 'secondary', 'tertiary', 'primary', 'secondary', 'tertiary'];
        return colors[index % colors.length];
    };

    // Map budgets to category grid format
    const categoryData = budgets.map((budget, index) => ({
        id: budget._id,
        name: budget.name,
        spent: budget.spent || 0,
        goal: budget.amount || 0,
        icon: getCategoryIcon(budget.name),
        color: getCategoryColor(index)
    }));

    return (
        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            {/* Editorial Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
                <div>
                    <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Budgets & Categories</h2>
                    <p className="text-on-tertiary-container text-lg">Curate your spending habits with precision and flair.</p>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <div className="flex bg-surface-container p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('budgets')}
                            className={`px-6 py-2 ${activeTab === 'budgets' ? 'bg-surface-container-highest text-primary' : 'text-on-tertiary-container hover:text-on-surface'} rounded-lg font-semibold text-sm transition-all`}
                        >
                            Budgets
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className={`px-6 py-2 ${activeTab === 'categories' ? 'bg-surface-container-highest text-primary' : 'text-on-tertiary-container hover:text-on-surface'} rounded-lg font-semibold text-sm transition-all`}
                        >
                            Categories
                        </button>
                    </div>
                    <button 
                        onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
                        className="bg-gradient-to-r from-primary to-on-primary-container text-on-primary px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary-container/20"
                    >
                        <Plus className="w-5 h-5" />
                        Set New Budget
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
                    {error}
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'budgets' ? (
                <div className="space-y-8">
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-12 gap-8">
                        {/* Main Total Budget Card (High Visual Weight) */}
                        <div className="col-span-12 lg:col-span-8 glass-card rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <span className="text-secondary font-semibold tracking-wider text-xs uppercase mb-1 block">Monthly Utilization</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-headline text-5xl font-extrabold text-on-surface">${totalSpent.toFixed(2)}</span>
                                            <span className="text-on-tertiary-container text-xl">/ ${totalBudget.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-secondary/10 px-4 py-2 rounded-full flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                        <span className="text-secondary text-sm font-bold">On Track</span>
                                    </div>
                                </div>
                                {/* Main Progress Bar */}
                                <div className="mb-8">
                                    <div className="h-4 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-on-primary-container rounded-full" style={{ width: `${utilizationPercentage}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-4 text-sm font-medium">
                                        <span className="text-on-tertiary-container">{utilizationPercentage.toFixed(0)}% of total budget utilized</span>
                                        <span className="text-on-surface">${remaining.toFixed(2)} remaining</span>
                                    </div>
                                </div>
                                {/* Secondary Insights Row */}
                                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-outline-variant/10">
                                    <div>
                                        <p className="text-on-tertiary-container text-xs font-bold uppercase tracking-widest mb-1">Projected Spend</p>
                                        <p className="text-xl font-bold text-on-surface">${(totalSpent + dailyAverage * (30 - new Date().getDate())).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-on-tertiary-container text-xs font-bold uppercase tracking-widest mb-1">Daily Average</p>
                                        <p className="text-xl font-bold text-on-surface">${dailyAverage.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-on-tertiary-container text-xs font-bold uppercase tracking-widest mb-1">Safe to Spend</p>
                                        <p className="text-xl font-bold text-secondary">${Math.max(0, safeToSpend).toFixed(2)} / day</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Category Breakdown Utility Card */}
                        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-3xl p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="font-headline text-xl font-bold mb-6">Efficiency Score</h3>
                                <div className="relative flex justify-center items-center py-4">
                                    {/* Circular Progress Simulation */}
                                    <div className="w-40 h-40 rounded-full border-[12px] border-surface-container-highest flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border-[12px] border-secondary border-t-transparent border-r-transparent -rotate-45"></div>
                                        <div className="text-center">
                                            <span className="text-4xl font-black text-on-surface block leading-none">{efficiencyScore.score}</span>
                                            <span className="text-xs text-on-tertiary-container font-bold uppercase">{efficiencyScore.tier}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-on-tertiary-container mt-6 leading-relaxed">
                                {spendingInsight}
                            </p>
                        </div>
                    </div>

                    {/* Budget Grid Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryData.map((category) => {
                            const percentage = (category.spent / category.goal) * 100;
                            const remaining = category.goal - category.spent;
                            
                            return (
                                <div key={category.id} className="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 bg-surface-container-highest rounded-xl text-${category.color} group-hover:bg-${category.color} group-hover:text-on-${category.color} transition-all`}>
                                            {category.icon}
                                        </div>
                                        <div className="relative">
                                            <button className="text-on-tertiary-container hover:text-on-surface">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            {/* Dropdown menu would be implemented here */}
                                        </div>
                                    </div>
                                    <h4 className="font-headline font-bold text-on-surface text-lg mb-1">{category.name}</h4>
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-2xl font-bold text-on-surface">${category.spent}</span>
                                        <span className="text-xs font-medium text-on-tertiary-container">Goal: ${category.goal}</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-container-lowest rounded-full mb-2">
                                        <div className={`h-full bg-${category.color} rounded-full`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className={`text-${percentage > 90 ? 'error' : category.color}`}>{percentage.toFixed(0)}% Used</span>
                                        <span className="text-on-tertiary-container">{remaining > 0 ? `$${remaining} Left` : 'Fully Funded'}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Add New Placeholder */}
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className="border-2 border-dashed border-outline-variant/20 p-6 rounded-2xl flex flex-col items-center justify-center hover:border-primary/40 hover:bg-surface-container-low group transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-on-tertiary-container group-hover:text-on-surface">Add New Category</span>
                        </button>
                    </div>

                    {/* Manage Categories (Contextual Peek) */}
                    <div className="mt-16">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-headline text-2xl font-bold text-on-surface">Managed Categories</h3>
                            <button 
                                onClick={() => setActiveTab('categories')}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                            >
                                View All
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Edit Category Form */}
                        {editingCategory && (
                            <div className="bg-surface-container rounded-3xl p-6 mb-6">
                                <h4 className="font-headline text-lg font-bold mb-4">Edit Category</h4>
                                <form onSubmit={handleSaveCategory} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="Category Name"
                                        className="flex-1 px-4 py-2 rounded-lg border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="submit" 
                                            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-semibold hover:bg-surface-container-high transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Delete Confirmation */}
                        {deleteConfirm && (
                            <div className="p-4 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <span>Are you sure you want to delete this category?</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-semibold hover:bg-surface-container-high transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(deleteConfirm)}
                                        className="px-4 py-2 bg-error text-on-error rounded-lg font-semibold hover:bg-error/90 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-surface-container rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-surface-container-highest/30">
                                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-tertiary-container">Category Name</th>
                                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-tertiary-container">Type</th>
                                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-tertiary-container">Monthly Cap</th>
                                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-tertiary-container text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {categories.map((category, index) => {
                                        // Find budget associated with this category
                                        const categoryBudget = budgets.find(budget => budget.category === category._id);
                                        const monthlyCap = categoryBudget ? `$${categoryBudget.amount.toFixed(2)}` : '$0.00';
                                        const color = index % 2 === 0 ? 'primary' : 'secondary';
                                        
                                        return (
                                            <tr key={category._id} className="hover:bg-surface-container-high transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full bg-${color}`}></div>
                                                        <span className="font-semibold">{category.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-on-tertiary-container text-sm">{category.type || 'Variable'}</td>
                                                <td className="px-8 py-4 text-sm font-medium">{monthlyCap}</td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            className="p-2 text-on-tertiary-container hover:text-primary transition-colors"
                                                            onClick={() => handleEditCategory(category)}
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            className="p-2 text-on-tertiary-container hover:text-error transition-colors"
                                                            onClick={() => handleDeleteCategory(category._id)}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <CategoryManager />
                </div>
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

            {/* Mobile Navigation Shell */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131b2e] h-16 flex justify-around items-center px-4 z-50">
                <a className="flex flex-col items-center text-[#738296]" href="/dashboard">
                    <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                    <span className="text-[10px] mt-1">Home</span>
                </a>
                <a className="flex flex-col items-center text-[#738296]" href="/wallet">
                    <span className="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
                    <span className="text-[10px] mt-1">Wallet</span>
                </a>
                <a className="flex flex-col items-center text-[#b6c4ff]" href="/budget">
                    <span className="material-symbols-outlined" data-icon="account_balance">account_balance</span>
                    <span className="text-[10px] mt-1 font-bold">Budgets</span>
                </a>
                <a className="flex flex-col items-center text-[#738296]" href="/saving-goal">
                    <span className="material-symbols-outlined" data-icon="savings">savings</span>
                    <span className="text-[10px] mt-1">Savings</span>
                </a>
                <a className="flex flex-col items-center text-[#738296]" href="/user-management">
                    <span className="material-symbols-outlined" data-icon="person">person</span>
                    <span className="text-[10px] mt-1">Profile</span>
                </a>
            </nav>

            {/* FAB for Mobile */}
            <div className="fixed bottom-8 right-8 z-50 md:hidden">
                <button 
                    onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
                    className="w-14 h-14 bg-gradient-to-r from-primary to-on-primary-container rounded-full flex items-center justify-center shadow-2xl text-on-primary"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default BudgetManager;