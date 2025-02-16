import React from 'react';
import { Card, CardContent, Typography, IconButton, Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/savingsGoalsCardStyles.css';

const SavingsGoalCard = ({ goal, onEdit, onDelete }) => {
    const { isDarkMode } = useTheme();

    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="goal-card-wrapper"
        >
            <Card className="savings-goal-card">
                <CardContent>
                    <Box className="card-header">
                        <Box className="title-section">
                            <FontAwesomeIcon icon={faBullseye} className="goal-icon" />
                            <div className="title-content">
                                <Typography variant="h6" className="goal-title">
                                    {goal.name}
                                </Typography>
                                <Typography variant="body2" className="goal-deadline">
                                    Target Date: {formatDate(goal.deadline)}
                                </Typography>
                            </div>
                        </Box>
                        <Box className="action-buttons">
                            <IconButton 
                                onClick={() => onEdit(goal)}
                                className="edit-button"
                                size="small"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </IconButton>
                            <IconButton 
                                onClick={() => onDelete(goal._id)}
                                className="delete-button"
                                size="small"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box className="progress-section">
                        <Typography variant="body2" className="progress-text">
                            Progress: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage}
                            className="progress-bar"
                        />
                    </Box>

                    {goal.description && (
                        <Typography 
                            variant="body2" 
                            className="goal-description"
                            sx={{ mt: 2 }}
                        >
                            {goal.description}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default SavingsGoalCard;