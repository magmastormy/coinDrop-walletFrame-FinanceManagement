import React from 'react';
import './styles/savingsGoalsCardStyles.css';

const SavingsGoalCard = ({ goal }) => {
    return (
        <div className="savings-goal-card">
            <h3>{goal.name}</h3>
            <p>Target Amount: ${goal.targetAmount}</p>
            <p>Current Amount: ${goal.currentAmount}</p>
            <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
            <p>Progress: {((goal.currentAmount / goal.targetAmount) * 100).toFixed(2)}%</p>
        </div>
    );
};

export default SavingsGoalCard;