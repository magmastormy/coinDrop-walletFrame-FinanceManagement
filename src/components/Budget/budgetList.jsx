import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, PieChart } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import BudgetCard from './budgetCard';

const BudgetList = ({ budgets = [], onEdit, onDelete }) => {
    const { theme } = useTheme();

    const budgetStats = Array.isArray(budgets) ? budgets.reduce((stats, budget) => {
        const spent = budget.spent || 0;
        return {
            totalBudget: stats.totalBudget + budget.amount,
            totalSpent: stats.totalSpent + spent,
            count: stats.count + 1,
            overBudgetCount: stats.overBudgetCount + (spent > budget.amount ? 1 : 0)
        };
    }, { totalBudget: 0, totalSpent: 0, count: 0, overBudgetCount: 0 }) : { totalBudget: 0, totalSpent: 0, count: 0, overBudgetCount: 0 };

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
            <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
                <PiggyBank className="w-16 h-16 text-muted-foreground/40 mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Budgets Yet</h3>
                <p className="text-muted-foreground">Create your first budget to start tracking your expenses</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            {budgetStats && (
                <div className="mb-6" role="region" aria-label="Budget summary">
                    <div className="flex items-center gap-3 mb-4">
                        <PieChart className="w-6 h-6 text-primary" aria-hidden="true" />
                        <h2 className="text-xl font-semibold text-foreground">Budget Overview</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Total Budget</span>
                            <span className="text-lg font-semibold text-foreground">{formatCurrency(budgetStats.totalBudget)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Total Spent</span>
                            <span className="text-lg font-semibold text-foreground">{formatCurrency(budgetStats.totalSpent)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Active Budgets</span>
                            <span className="text-lg font-semibold text-foreground">{budgetStats.count}</span>
                        </div>
                        {budgetStats.overBudgetCount > 0 && (
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Over Budget</span>
                                <span className="text-lg font-semibold text-destructive">{budgetStats.overBudgetCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-3">
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