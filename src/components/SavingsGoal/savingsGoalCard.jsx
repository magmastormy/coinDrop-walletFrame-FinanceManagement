import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';
import './styles/savingsGoalsCardStyles.css';

const SavingsGoalCard = ({ goal }) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    
    return (
        <div className="savings-goal-card">
            <div className="card-header">
                <FontAwesomeIcon icon={faBullseye} className="goal-icon" />
                <h3 className="goal-title">{goal.name}</h3>
            </div>
            
            <div className="progress-container">
                <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
                <span className="progress-text">{progress.toFixed(1)}%</span>
            </div>

            <div className="goal-details">
                <div className="detail-item">
                    <span className="detail-label">Target</span>
                    <span className="detail-value">${goal.targetAmount}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Saved</span>
                    <span className="detail-value">${goal.currentAmount}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value">
                        {new Date(goal.deadline).toLocaleDateString('en-US', {
                            month: 'short', 
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SavingsGoalCard;