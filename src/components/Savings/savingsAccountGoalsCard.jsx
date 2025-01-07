import React from 'react';
import { Card, CardContent, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import './styles/savingsAccountGoalsCardStyles.css';

const SavingsAccountGoalsCard = ({ goal, onEdit, onDelete }) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <Card className="savings-account-goal-card">
            <CardContent>
                <div className="goal-header">
                    <Typography variant="h6" component="h2">
                        {goal.name}
                    </Typography>
                    <div className="goal-actions">
                        <Tooltip title="Edit Goal">
                            <IconButton onClick={() => onEdit(goal)} size="small">
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Goal">
                            <IconButton onClick={() => onDelete(goal._id)} size="small">
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {goal.description}
                </Typography>

                <div className="goal-progress">
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        className="progress-bar"
                    />
                    <Typography variant="body2" className="progress-text">
                        {progress.toFixed(1)}%
                    </Typography>
                </div>

                <div className="goal-details">
                    <div className="goal-amount">
                        <Typography variant="body2" color="textSecondary">
                            Current: {formatCurrency(goal.currentAmount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Target: {formatCurrency(goal.targetAmount)}
                        </Typography>
                    </div>
                    <div className="goal-time">
                        <Typography variant="body2" color="textSecondary">
                            Remaining: {formatCurrency(remainingAmount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {daysRemaining} days left
                        </Typography>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SavingsAccountGoalsCard;