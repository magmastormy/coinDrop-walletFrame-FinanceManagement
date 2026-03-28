import React from 'react';
import { motion } from 'framer-motion';
import TransactionCard from '../Transaction/transactionCard';
import { cn } from '../../lib/utils';

const BudgetTransactionList = ({ transactions, budget }) => {
    const progress = {
        spent: transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0),
        remaining: budget.amount - transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0),
        percentage: (transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0) / budget.amount) * 100
    };

    return (
        <div className="space-y-6">
            {/* Progress Section */}
            <Card variant="default" elevation={1} className="p-6 space-y-4">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Budget Usage</span>
                    <span className={cn(
                        progress.percentage > 100 ? "text-error" : "text-success"
                    )}>
                        {progress.percentage.toFixed(1)}%
                    </span>
                </div>

                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "h-full rounded-full",
                            progress.percentage > 90 ? "bg-error" :
                                progress.percentage > 70 ? "bg-warning" : "bg-success"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-center text-sm">
                    <Card variant="secondary" className="p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Total Budget</div>
                        <div className="font-bold text-primary">${budget.amount}</div>
                    </Card>
                    <Card variant="secondary" className="p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Spent</div>
                        <div className="font-bold text-error">${progress.spent.toFixed(2)}</div>
                    </Card>
                    <Card variant="secondary" className="p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                        <div className={cn("font-bold", progress.remaining < 0 ? "text-error" : "text-success")}>
                            ${progress.remaining.toFixed(2)}
                        </div>
                    </Card>
                </div>
            </Card>

            {/* Transactions List */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">Recent Transactions</h3>
                {transactions.length > 0 ? (
                    <div className="space-y-2">
                        {transactions.map(transaction => (
                            <TransactionCard
                                key={transaction._id}
                                transaction={transaction}
                            />
                        ))}
                    </div>
                ) : (
                    <Card variant="default" className="text-center py-8">
                        <p className="text-muted-foreground">No transactions found for this budget</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default BudgetTransactionList;
