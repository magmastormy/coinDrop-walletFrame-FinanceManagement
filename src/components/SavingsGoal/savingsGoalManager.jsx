import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import SavingsGoalCard from './savingsGoalCard';
import NewGoalCard from './NewGoalCard';
import EditGoalModal from './editGoalModal';
import savingsGoalService from '../../services/savingsGoalService';
import './styles/savingsGoalManagerStyles.css';
import ReportSection from '../Common/ReportSection';

const SavingsGoalManager = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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
            setGoals(response || []);
        } catch (error) {
            setError('Failed to load savings goals. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGoal = async (newGoal) => {
        try {
            await savingsGoalService.createSavingsGoal({
                ...newGoal,
                userId: user.id
            });
            await fetchGoals();
        } catch (error) {
            setError('Failed to create savings goal. Please try again later.');
        }
    };

    const handleUpdateGoal = async (goalId, updatedData) => {
        try {
            await savingsGoalService.updateSavingsGoal(goalId, updatedData);
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
                await savingsGoalService.deleteSavingsGoal(goalId);
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
            </Box>

            {/* Summary Section */}
            <Box className="summary-section" sx={{ mb: 3 }}>
                <Card>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">Total Saved</Typography>
                            <Typography variant="h4">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                    .format(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">Total Target</Typography>
                            <Typography variant="h4">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                    .format(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">Goals</Typography>
                            <Typography variant="h4">{goals.length}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <ReportSection title="Savings Goals Report" accountId={user?.id} reportType="savings-report" />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            <Grid container spacing={3} className="goals-grid">
                <Grid item xs={12} sm={6} md={4}>
                    <NewGoalCard onCreate={handleCreateGoal} />
                </Grid>
                {goals.map(goal => (
                    <Grid item xs={12} sm={6} md={4} key={goal._id}>
                        <SavingsGoalCard
                            goal={goal}
                            onEdit={setEditingGoal}
                            onDelete={handleDeleteGoal}
                        />
                    </Grid>
                ))}
            </Grid>
            {editingGoal && (
                <EditGoalModal
                    open={Boolean(editingGoal)}
                    goal={editingGoal}
                    onClose={() => setEditingGoal(null)}
                    onSave={(updatedData) => handleUpdateGoal(editingGoal._id, updatedData)}
                />
            )}
        </div>
    );
};

export default SavingsGoalManager;