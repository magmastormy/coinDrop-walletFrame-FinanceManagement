import React from 'react';
import SavingsAccountCard from './savingsAccountCard';
import SavingsGoalCard from './savingsGoalCard';
import './styles/savingsGoalsListStyles.css';

const SavingsAccountGoalList = ({ accounts, goals }) => {
    return (
        <div className="savings-account-goal-list">
            <h2>Savings Accounts</h2>
            <div className="savings-accounts">
                {accounts.map(account => (
                    <SavingsAccountCard key={account._id} account={account} />
                ))}
            </div>
            <h2>Savings Goals</h2>
            <div className="savings-goals">
                {goals.map(goal => (
                    <SavingsGoalCard key={goal._id} goal={goal} />
                ))}
            </div>
        </div>
    );
};

export default SavingsAccountGoalList;