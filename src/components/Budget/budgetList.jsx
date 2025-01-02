import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank, faChartPie } from '@fortawesome/free-solid-svg-icons';
import BudgetCard from './budgetCard';
import './styles/budgetListStyles.css';

const BudgetList = ({ budgets = [], onEdit, onDelete }) => {
    const budgetStats = useMemo(() => {
        if (!Array.isArray(budgets)) return null;
        
        return budgets.reduce((stats, budget) => {
            const spent = budget.spent || 0;
            return {
                totalBudget: stats.totalBudget + budget.amount,
                totalSpent: stats.totalSpent + spent,
                count: stats.count + 1,
                overBudgetCount: stats.overBudgetCount + (spent > budget.amount ? 1 : 0)
            };
        }, { totalBudget: 0, totalSpent: 0, count: 0, overBudgetCount: 0 });
    }, [budgets]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!Array.isArray(budgets)) {
        console.warn('BudgetList: budgets prop is not an array');
        return null;
    }

    if (budgets.length === 0) {
        return (
            <div className="empty-state" role="status">
                <FontAwesomeIcon icon={faPiggyBank} className="empty-state-icon" aria-hidden="true" />
                <h3>No Budgets Yet</h3>
                <p>Create your first budget to start tracking your expenses</p>
            </div>
        );
    }

    return (
        <div className="budget-container">
            {budgetStats && (
                <div className="budget-summary" role="region" aria-label="Budget summary">
                    <div className="summary-header">
                        <h2>
                            <FontAwesomeIcon icon={faChartPie} aria-hidden="true" />
                            Budget Overview
                        </h2>
                    </div>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Budget</span>
                            <span className="stat-value">{formatCurrency(budgetStats.totalBudget)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Spent</span>
                            <span className="stat-value">{formatCurrency(budgetStats.totalSpent)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Active Budgets</span>
                            <span className="stat-value">{budgetStats.count}</span>
                        </div>
                        {budgetStats.overBudgetCount > 0 && (
                            <div className="stat-item warning">
                                <span className="stat-label">Over Budget</span>
                                <span className="stat-value">{budgetStats.overBudgetCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div 
                className="budget-list"
                role="list"
                aria-label="List of budgets"
            >
                <AnimatePresence>
                    {budgets.map(budget => (
                        <motion.div
                            key={budget._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            role="listitem"
                        >
                            <BudgetCard
                                budget={budget}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BudgetList;