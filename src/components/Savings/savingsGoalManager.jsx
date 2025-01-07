import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
    Button, 
    Card, 
    CardContent, 
    Typography,
    IconButton,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import savingsGoalService from '../../services/savingsGoalService';
import { setSavingsGoals, setLoading, setError } from '../../slices/savingsGoalSlice';
import './styles/savingsGoalManagerStyles.css';
import EditGoalModal from './editGoalModal';
import NewGoalDialog from './newGoalDialog';

const SavingsGoalManager = () => {
    const dispatch = useDispatch();
    const savingsGoals = useSelector(state => state.savingsGoal.savingsGoals) || [];
    const loading = useSelector(state => state.savingsGoal.loading);
    const error = useSelector(state => state.savingsGoal.error);
    const user = useSelector(state => state.auth.user);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isNewGoalModalOpen, setNewGoalModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    useEffect(() => {
        if (user?.id) {
            const fetchSavingsGoals = async () => {
                dispatch(setLoading(true));
                try {
                    const data = await savingsGoalService.getSavingsGoals(user.id);
                    dispatch(setSavingsGoals(data));
                } catch (err) {
                    console.error('Error fetching savings goals:', err);
                    dispatch(setError('Unable to fetch savings goals. Please try again later.'));
                } finally {
                    dispatch(setLoading(false));
                }
            };

            fetchSavingsGoals();
        }
    }, [dispatch, user]);

    const handleCreateGoal = async (goalData) => {
        dispatch(setLoading(true));
        try {
            await savingsGoalService.createSavingsGoal({
                ...goalData,
                userId: user.id
            });
            setNewGoalModalOpen(false);
            const data = await savingsGoalService.getSavingsGoals(user.id);
            dispatch(setSavingsGoals(data));
        } catch (err) {
            console.error('Error creating savings goal:', err);
            dispatch(setError('Failed to create savings goal. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateGoal = async (goalId, updatedData) => {
        dispatch(setLoading(true));
        try {
            await savingsGoalService.updateSavingsGoal(goalId, updatedData);
            setEditModalOpen(false);
            setSelectedGoal(null);
            const data = await savingsGoalService.getSavingsGoals(user.id);
            dispatch(setSavingsGoals(data));
        } catch (err) {
            console.error('Error updating savings goal:', err);
            dispatch(setError('Failed to update savings goal. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (!window.confirm('Are you sure you want to delete this savings goal?')) {
            return;
        }

        dispatch(setLoading(true));
        try {
            await savingsGoalService.deleteSavingsGoal(goalId);
            const data = await savingsGoalService.getSavingsGoals(user.id);
            dispatch(setSavingsGoals(data));
        } catch (err) {
            console.error('Error deleting savings goal:', err);
            dispatch(setError('Failed to delete savings goal. Please try again.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleEditGoal = (goal) => {
        setSelectedGoal(goal);
        setEditModalOpen(true);
    };

    const calculateProgress = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="savings-goal-manager">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Savings Goals
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setNewGoalModalOpen(true)}
                >
                    New Goal
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && savingsGoals.length === 0 ? (
                <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" align="center">
                            You haven't set any savings goals yet. Click "New Goal" to get started!
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <motion.div layout className="goals-grid">
                    {savingsGoals.map(goal => (
                        <motion.div
                            key={goal._id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Card className="goal-card">
                                <CardContent>
                                    <Box className="goal-header">
                                        <Typography variant="h6">{goal.name}</Typography>
                                        <Box>
                                            <IconButton 
                                                onClick={() => handleEditGoal(goal)}
                                                size="small"
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => handleDeleteGoal(goal._id)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    
                                    <Box className="goal-progress">
                                        <div 
                                            className="progress-bar"
                                            style={{ 
                                                width: `${calculateProgress(goal.currentAmount, goal.targetAmount)}%`
                                            }}
                                        />
                                        <Typography variant="body2" color="textSecondary" className="progress-text">
                                            {calculateProgress(goal.currentAmount, goal.targetAmount).toFixed(1)}%
                                        </Typography>
                                    </Box>

                                    <Box className="goal-amounts">
                                        <Typography variant="body1">
                                            ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                                        </Typography>
                                    </Box>

                                    {goal.description && (
                                        <Typography variant="body2" color="textSecondary" className="goal-description">
                                            {goal.description}
                                        </Typography>
                                    )}

                                    <Typography variant="caption" color="textSecondary" className="goal-deadline">
                                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <NewGoalDialog
                open={isNewGoalModalOpen}
                onClose={() => setNewGoalModalOpen(false)}
                onSubmit={handleCreateGoal}
            />

            {selectedGoal && (
                <EditGoalModal
                    open={isEditModalOpen}
                    goal={selectedGoal}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedGoal(null);
                    }}
                    onSubmit={(updatedData) => handleUpdateGoal(selectedGoal._id, updatedData)}
                />
            )}
        </div>
    );
};

export default SavingsGoalManager;