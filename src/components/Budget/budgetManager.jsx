import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import transactionService from '../../services/transactionService';
import categoryService from '../../services/categoryService';
import walletService from '../../services/walletService';
import CreateBudgetModal from './createBudgetModal';
import BudgetList from './budgetList';
import BudgetTransactionList from './budgetTransactionList';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';
import TransactionChart from '../Transaction/transactionCharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faChartLine} from '@fortawesome/free-solid-svg-icons';
import './styles/budgetManagerStyles.css';

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
            dispatch(setBudgets(fetchedBudgets));
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

    const handleBudgetSelect = async (budget) => {
        try {
            const data = await transactionService.getBudgetTransactions(budget._id);
            console.log('[BudgetManager: handleBudgetSelect] response data: ', data);
            setTransactions(data.transactions);
            setSelectedBudget(budget);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBudgetCreated = () => {
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
        <div className="budget-manager">
            <div className="budget-header">
                <h2>Budget Management</h2>
                <button onClick={() => {
                    setEditingBudget(null);
                    setIsModalOpen(true);
                }} className="create-budget-btn">
                    Create Budget
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="budget-content">
                <div className="budget-list-section">
                    <BudgetList
                        budgets={budgets}
                        onEdit={(budget) => {
                            setEditingBudget(budget);
                            setIsModalOpen(true);
                        }}
                        onDelete={handleDeleteBudget}
                        onSelect={setSelectedBudget}
                        selectedBudget={selectedBudget}
                    />
                </div>

                <div className="budget-details-section">
                    {selectedBudget && (
                        <>
                            <BudgetTransactionList
                                budget={selectedBudget}
                                transactions={transactions}
                                onFilterChange={handleFilterChange}
                                filter={filter}
                            />
                            <div className="budget-charts">
                                <BudgetChart budget={selectedBudget} />
                                <BudgetPerformanceChart budget={selectedBudget} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CreateBudgetModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBudget(null);
                }}
                onCreateBudget={handleBudgetCreated}
                categories={categories}
                wallets={wallets}
                userId={user.id}
                budgetData={editingBudget}
            />
        </div>
    );
};

export default BudgetManager;