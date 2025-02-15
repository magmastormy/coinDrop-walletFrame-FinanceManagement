import React from 'react';
import { Card, CardContent, Typography, IconButton, Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/savingsGoalsCardStyles.css';

const SavingsGoalCard = ({ goal, onEdit, onDelete }) => {
    const { theme, isDarkMode } = useTheme();

    const cardStyle = {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        transition: theme.transition,
        marginBottom: '1rem',
        borderRadius: '8px',
    };

    const buttonStyle = {
        backgroundColor: theme.button.base,
        color: theme.text.primary,
        '&:hover': {
            backgroundColor: theme.button.hover,
        }
    };

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
        >
            <Card style={cardStyle}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <FontAwesomeIcon icon={faBullseye} className="goal-icon" />
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.heading }}
                            >
                                {goal.name}
                            </Typography>
                            <Typography 
                                variant="body2"
                                style={{ color: theme.text.secondary }}
                            >
                                Target Date: {formatDate(goal.deadline)}
                            </Typography>
                        </Box>
                        <Box>
                            <IconButton 
                                onClick={() => onEdit(goal)}
                                style={buttonStyle}
                                size="small"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </IconButton>
                            <IconButton 
                                onClick={() => onDelete(goal._id)}
                                style={buttonStyle}
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box mt={2}>
                        <Typography variant="body2" style={{ color: theme.text.primary }}>
                            Progress: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage}
                            sx={{
                                mt: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.background.primary,
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.button.base
                                }
                            }}
                        />
                    </Box>

                    {goal.description && (
                        <Typography 
                            variant="body2" 
                            style={{ color: theme.text.secondary }}
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