import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import savingsGoalService from '../../services/savingsGoalService';
import { setSavingsGoals, setLoading, setError } from '../../slices/savingsGoalSlice';
import './styles/savingsGoalStyles.css';
import EditGoalModal from './editGoalModal'; // New modal for editing goals

const SavingsGoalManager = () => {
    const dispatch = useDispatch();
    const savingsGoals = useSelector(state => state.savingsGoal.savingsGoals);
    const loading = useSelector(state => state.savingsGoal.loading);
    const error = useSelector(state => state.savingsGoal.error);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    useEffect(() => {
        const fetchSavingsGoals = async () => {
            dispatch(setLoading(true));
            try {
                const data = await savingsGoalService.getUserSavingsGoals();
                dispatch(setSavingsGoals(data));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSavingsGoals();
    }, [dispatch]);

    const handleCreateGoal = async (goalData) => {
        try {
            await savingsGoalService.createSavingsGoal(goalData);
            // Optionally refetch or update state
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditGoal = (goal) => {
        setSelectedGoal(goal);
        setEditModalOpen(true);
    };

    const handleUpdateGoal = async (updatedGoal) => {
        try {
            await savingsGoalService.updateSavingsGoal(updatedGoal);
            setEditModalOpen(false);
            // Optionally refetch or update state
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteGoal = async (goalId) => {
        try {
            await savingsGoalService.deleteSavingsGoal(goalId);
            // Optionally refetch or update state
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <div className="savings-goal-manager">
            <h2>Savings Goals</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            <ul>
                {savingsGoals.map(goal => (
                    <li key={goal._id}>
                        {goal.name}: ${goal.currentAmount} / ${goal.targetAmount}
                        <button onClick={() => handleEditGoal(goal)}>Edit</button>
                        <button onClick={() => handleDeleteGoal(goal._id)}>Delete</button>
                    </li>
                ))}
            </ul>
            <EditGoalModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                goal={selectedGoal}
                onUpdate={handleUpdateGoal}
            />
            {/* Add a button or form to create a new savings goal */}
        </div>
    );
};

export default SavingsGoalManager;