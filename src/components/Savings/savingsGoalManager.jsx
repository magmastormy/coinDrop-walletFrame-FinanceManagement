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
    CircularProgress
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
        const fetchSavingsGoals = async () => {
            if (!user?.id) return;
            
            dispatch(setLoading(true));
            try {
                const data = await savingsGoalService.getSavingsGoals(user.id);
                dispatch(setSavingsGoals(data));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSavingsGoals();
    }, [dispatch, user]);

    const handleEditGoal = (goal) => {
        setSelectedGoal(goal);
        setEditModalOpen(true);
    };

    const handleDeleteGoal = async (goalId) => {
        if (!window.confirm('Are you sure you want to delete this savings goal?')) {
            return;
        }

        try {
            await savingsGoalService.deleteSavingsGoal(goalId);
            const data = await savingsGoalService.getSavingsGoals(user.id);
            dispatch(setSavingsGoals(data));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const calculateProgress = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    if (loading) {
        return (
            <Box className="savings-goal-manager loading">
                <CircularProgress />
                <Typography>Loading savings goals...</Typography>
            </Box>
        );
    }

    return (
        <motion.div 
            className="savings-goal-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box className="header">
                <Typography variant="h4" component="h1">
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
                <Typography className="error-message" color="error">
                    {error}
                </Typography>
            )}

            {savingsGoals.length === 0 ? (
                <Card className="empty-state">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            No savings goals yet
                        </Typography>
                        <Typography color="textSecondary" paragraph>
                            Create your first savings goal to start tracking your progress!
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setNewGoalModalOpen(true)}
                        >
                            Create First Goal
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="goals-grid">
                    {savingsGoals.map(goal => (
                        <Card key={goal._id} className="goal-card">
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
                    ))}
                </div>
            )}

            <EditGoalModal
                open={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                goal={selectedGoal}
            />

            <NewGoalDialog
                open={isNewGoalModalOpen}
                onClose={() => setNewGoalModalOpen(false)}
            />
        </motion.div>
    );
};

export default SavingsGoalManager;