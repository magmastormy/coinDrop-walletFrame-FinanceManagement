import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import walletService from '../../services/walletService';
import CreateBudgetModal from './createBudgetModal';
import BudgetGrid from './budgetGrid';
import BudgetAnalytics from './budgetAnalytics';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';
import TransactionChart from '../Transaction/transactionCharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faChartLine} from '@fortawesome/free-solid-svg-icons';
import './styles/budgetManagerStyles.css';
import ReportSection from '../Common/ReportSection';
import { Box, Grid, AppBar, Toolbar, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';

const BudgetManager = () => 
{
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
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    
    useEffect(() => {
        fetchBudgets();
        fetchCategories();
        fetchWallets();
    }, [dispatch]);

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
            console.log('[BudgetManager] Budgets fetched:', fetchedBudgets);
            dispatch(setBudgets(fetchedBudgets.budgets));
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
            setSelectedBudgetId(budgetId);
            setIsLoading(true);
            
            // Fetch budget transactions
            const transactions = await transactionService.getBudgetTransactions(budgetId);
            setTransactions(transactions?.data?.transactions || []);
        } catch (error) {
            console.error(error);
            // Provide a fallback for missing transactions
            setTransactions([]);
            // Only show error if it's not a 404 (endpoint missing during development)
            if (error?.response?.status !== 404) {
                toast.error("Failed to load budget transactions");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBudgetCreated = () => {
        console.log('Budget created callback triggered!');
        fetchBudgets();
        setIsModalOpen(false);
    };

    const handleEditBudget = (budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };

    const handleDeleteBudget = async (budgetId) => {
       try {
           await budgetService.deleteBudget(budgetId);
           fetchBudgets();
       } catch (err) {
           dispatch(setError(err.message));
       }
   };

    const handleFilterChange = (e) => {
       setFilter({ ...filter, [e.target.name]: e.target.value });
   };

    const handleCreateBudget = async (newBudget) => {
        try {
            if (editingBudget) {
                await budgetService.updateBudget(editingBudget._id, newBudget);
            } else {
                await budgetService.createBudget(newBudget);
            }
            await fetchBudgets();
            setIsModalOpen(false);
        } catch (error) {
            dispatch(setError(`Budget save failed: ${error.message}`));
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar disableGutters>
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>Budget Management</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}>
                        Create Budget
                    </Button>
                    <ReportSection
                        title="Budget Report"
                        accountId={selectedBudget?._id || user?.id}
                        reportType="budget-performance"
                    />
                </Toolbar>
            </AppBar>
            {error && <Typography color="error">{error}</Typography>}
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <BudgetGrid
                        budgets={budgets}
                        onEdit={b => { setEditingBudget(b); setIsModalOpen(true); }}
                        onDelete={handleDeleteBudget}
                        onSelect={handleBudgetSelect}
                        selectedBudget={selectedBudget}
                    />
                </Grid>
                <Grid item xs={12}>
                    <BudgetAnalytics
                        budget={selectedBudget}
                        transactions={transactions}
                        filter={filter}
                        onFilterChange={handleFilterChange}
                    />
                </Grid>
            </Grid>
            <CreateBudgetModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
                onCreateBudget={handleBudgetCreated}
                categories={categories}
                wallets={wallets}
                userId={user.id}
                budgetData={editingBudget}
            />
        </Box>
    );
};

export default BudgetManager;