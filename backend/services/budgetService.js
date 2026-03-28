const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');

class BudgetService {
    /**
     * Update budget spent amount by aggregating transactions
     */
    static async updateBudgetSpent(budgetId) {
        const budget = await Budget.findById(budgetId);
        if (!budget) return null;

        const categoryQuery = [budget.category];
        
        // Include subcategories if configured
        if (budget.includeSubcategories) {
            const category = await Category.findById(budget.category);
            if (category) {
                const subcategories = await category.getAllSubcategories();
                categoryQuery.push(...subcategories.map(sub => sub._id));
            }
        }

        const totalSpent = await Transaction.aggregate([
            {
                $match: {
                    budgetId: budget._id,
                    category: { $in: categoryQuery },
                    affectsBudget: true,
                    date: { 
                        $gte: budget.startDate,
                        $lte: budget.endDate || new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        budget.spent = totalSpent[0]?.total || 0;
        await budget.save();
        
        return budget;
    }

    /**
     * Calculate remaining budget amount
     */
    static calculateRemainingAmount(budget) {
        const total = budget.amount + (budget.rollover.enabled ? budget.rollover.amount : 0);
        return Math.max(0, total - budget.spent - budget.committed);
    }

    /**
     * Get all user budgets with calculated spent amounts
     */
    static async getUserBudgetsWithSpent(userId) {
        const budgets = await Budget.find({ userId })
            .populate('category')
            .sort({ startDate: -1 });

        // Calculate remaining for each budget
        const budgetsWithRemaining = budgets.map(budget => ({
            ...budget.toObject(),
            remaining: this.calculateRemainingAmount(budget)
        }));

        return budgetsWithRemaining;
    }

    /**
     * Update budget spent after transaction change
     */
    static async recalculateBudgetForTransaction(transactionId) {
        const transaction = await Transaction.findById(transactionId)
            .populate('budgetId');
        
        if (!transaction || !transaction.budgetId) return;

        await this.updateBudgetSpent(transaction.budgetId._id);
    }

    /**
     * Validate transaction against budget constraints
     */
    static async validateTransactionAgainstBudget(budgetId, transactionData) {
        const budget = await Budget.findById(budgetId);
        
        if (!budget) {
            return {
                valid: false,
                error: 'BUDGET_NOT_FOUND',
                message: 'Budget not found'
            };
        }

        if (!budget.isActive) {
            return {
                valid: false,
                error: 'BUDGET_INACTIVE',
                message: 'Budget is not active'
            };
        }

        // Check date range
        const txDate = transactionData.date ? new Date(transactionData.date) : new Date();
        if (txDate < budget.startDate || (budget.endDate && txDate > budget.endDate)) {
            return {
                valid: false,
                error: 'OUTSIDE_BUDGET_PERIOD',
                message: 'Transaction date outside budget period'
            };
        }

        // Check type match
        if (budget.type !== transactionData.type) {
            return {
                valid: false,
                error: 'TYPE_MISMATCH',
                message: 'Transaction type does not match budget type'
            };
        }

        // Check remaining budget
        const remaining = this.calculateRemainingAmount(budget);
        if (transactionData.type === 'expense' && transactionData.amount > remaining) {
            return {
                valid: false,
                error: 'EXCEEDS_BUDGET',
                message: `Transaction exceeds remaining budget`,
                details: {
                    remaining,
                    requested: transactionData.amount,
                    difference: transactionData.amount - remaining
                }
            };
        }

        return { valid: true };
    }

    /**
     * Get budget utilization statistics
     */
    static async getBudgetUtilization(userId) {
        const budgets = await Budget.find({ userId, isActive: true });
        
        const utilization = await Promise.all(budgets.map(async budget => {
            const remaining = this.calculateRemainingAmount(budget);
            const used = budget.spent;
            const total = budget.amount + (budget.rollover.enabled ? budget.rollover.amount : 0);
            
            return {
                budgetId: budget._id,
                name: budget.name,
                category: budget.category,
                total,
                used,
                remaining,
                utilizationPercent: total > 0 ? (used / total) * 100 : 0,
                status: this.getBudgetStatus(budget)
            };
        }));

        return utilization;
    }

    /**
     * Get budget status based on utilization
     */
    static getBudgetStatus(budget) {
        const remaining = this.calculateRemainingAmount(budget);
        const total = budget.amount + (budget.rollover.enabled ? budget.rollover.amount : 0);
        const utilization = total > 0 ? (budget.spent / total) * 100 : 0;

        if (utilization >= 100) return 'exceeded';
        if (utilization >= 90) return 'critical';
        if (utilization >= 75) return 'warning';
        if (utilization >= 50) return 'moderate';
        return 'healthy';
    }

    /**
     * Auto-renew recurring budgets
     */
    static async autoRenewRecurringBudgets() {
        const recurringBudgets = await Budget.find({
            'automation.recurring.enabled': true,
            'automation.recurring.autoRenew': true,
            endDate: { $lte: new Date() },
            isActive: true
        });

        const renewed = [];
        
        for (const budget of recurringBudgets) {
            try {
                // Calculate new period based on current period
                let newStartDate = new Date(budget.endDate);
                newStartDate.setDate(newStartDate.getDate() + 1);
                
                let newEndDate;
                switch (budget.period) {
                    case 'daily':
                        newEndDate = new Date(newStartDate);
                        newEndDate.setDate(newEndDate.getDate() + 1);
                        break;
                    case 'weekly':
                        newEndDate = new Date(newStartDate);
                        newEndDate.setDate(newEndDate.getDate() + 7);
                        break;
                    case 'monthly':
                        newEndDate = new Date(newStartDate);
                        newEndDate.setMonth(newEndDate.getMonth() + 1);
                        break;
                    case 'yearly':
                        newEndDate = new Date(newStartDate);
                        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                        break;
                }

                // Create new budget instance
                const newBudget = new Budget({
                    userId: budget.userId,
                    name: `${budget.name} (Auto-renewed)`,
                    amount: budget.amount,
                    type: budget.type,
                    period: budget.period,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    walletId: budget.walletId,
                    category: budget.category,
                    includeSubcategories: budget.includeSubcategories,
                    automation: budget.automation
                });

                await newBudget.save();
                renewed.push(newBudget._id);

                // Deactivate old budget
                budget.isActive = false;
                await budget.save();

            } catch (error) {
                console.error(`Failed to renew budget ${budget._id}:`, error);
            }
        }

        return renewed;
    }
}

module.exports = BudgetService;
