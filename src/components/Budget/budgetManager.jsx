import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import CreateBudgetModal from './createBudgetModal';
import BudgetList from './budgetList';
import './styles/budgetStyles.css';

const BudgetManager = () => {
    const dispatch = useDispatch();
    const { budgets, loading, error } = useSelector(state => state.budget);
    const { user } = useSelector(state => state.auth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    useEffect(() => {
        fetchBudgets();
    }, [dispatch]);

    const fetchBudgets = async () => {
        dispatch(setLoading(true));
        try {
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }
            const data = await budgetService.getUserBudgets(user.id);
            console.log('Budget Manager - Fetched data:', data);
            console.log('Budget Manager - Fetched data.budgets:', data.budgets);

            if (data && Array.isArray(data.budgets))
            {
                dispatch(setBudgets(data.budgets));
            }
            else{
                dispatch(setBudgets([]))
            }
            //dispatch(setBudgets(data.budgets || []));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleBudgetCreated = () => {
        fetchBudgets(); // Refresh the budget list after creating a new budget
        setIsModalOpen(false);
    };

    const handleEditBudget = (budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };

    const handleDeleteBudget = async (budgetId) => {
        try {
            await budgetService.deleteBudget(budgetId);
            fetchBudgets(); // Refresh the budget list after deletion
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <div className="budget-manager">
            <h2>My Budgets</h2>
            <button onClick={() => setIsModalOpen(true)} className="create-budget-btn">+ Create Budget</button>
            {loading && <p>Loading budgets...</p>}
            {error && <p className="error-message">{error}</p>}
            <BudgetList budgets={budgets} onEdit={handleEditBudget} onDelete={handleDeleteBudget} />
            <CreateBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onBudgetCreated={handleBudgetCreated} />
        </div>
    );
};

export default BudgetManager;