import React, { useState, useEffect } from 'react';
import { Grid, Box, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import SavingsGoalList from './savingsGoalList';
import NewGoalDialog from './newGoalDialog';
import EditGoalModal from './editGoalModal';
import savingsGoalService from '../../services/savingsGoalService';
import './styles/savingsGoalManagerStyles.css';

const SavingsGoalManager = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchGoals();
        }
    }, [user]);

    const fetchGoals = async () => {
        try {
            setIsLoading(true);
            const response = await savingsGoalService.getSavingsGoals(user.id);
            console.log("SavingsGoalManager - fetchGoals - Response:", response);
            setGoals(response || []);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            setError('Failed to load savings goals. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGoal = async (newGoal) => {
        try {
            await savingsGoalService.createGoal({
                ...newGoal,
                userId: user.id
            });
            await fetchGoals();
            setIsNewGoalDialogOpen(false);
        } catch (error) {
            console.error('Failed to create goal:', error);
            setError('Failed to create savings goal. Please try again later.');
        }
    };

    const handleUpdateGoal = async (goalId, updatedData) => {
        try {
            await savingsGoalService.updateGoal(goalId, updatedData);
            await fetchGoals();
            setEditingGoal(null);
        } catch (error) {
            console.error('Failed to update goal:', error);
            setError('Failed to update savings goal. Please try again later.');
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (window.confirm('Are you sure you want to delete this savings goal?')) {
            try {
                await savingsGoalService.deleteGoal(goalId);
                await fetchGoals();
            } catch (error) {
                console.error('Failed to delete goal:', error);
                setError('Failed to delete savings goal. Please try again later.');
            }
        }
    };

    if (isLoading) {
        return (
            <Box className="loading-container">
                <CircularProgress className="progress-indicator" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="error-container">
                {error}
            </Box>
        );
    }

    return (
        <div className="savings-goal-manager">
            <Box className="header-section">
                <h2>Savings Goals</h2>
                <Button
                    variant="contained"
                    className="new-goal-button"
                    onClick={() => setIsNewGoalDialogOpen(true)}
                >
                    New Goal
                </Button>
            </Box>

            <Grid container spacing={3} className="goals-grid">
                <Grid item xs={12}>
                    <SavingsGoalList
                        goals={goals}
                        onEdit={setEditingGoal}
                        onDelete={handleDeleteGoal}
                        isLoading={isLoading}
                        error={error}
                        onNewGoal={() => setIsNewGoalDialogOpen(true)}
                    />
                </Grid>
            </Grid>

            <NewGoalDialog
                open={isNewGoalDialogOpen}
                onClose={() => setIsNewGoalDialogOpen(false)}
                onCreate={handleCreateGoal}
            />

            {editingGoal && (
                <EditGoalModal
                    open={!!editingGoal}
                    goal={editingGoal}
                    onClose={() => setEditingGoal(null)}
                    onSave={(updatedData) => handleUpdateGoal(editingGoal._id, updatedData)}
                />
            )}
        </div>
    );
};

export default SavingsGoalManager;