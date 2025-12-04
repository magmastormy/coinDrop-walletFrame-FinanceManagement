import React from 'react';
import { motion } from 'framer-motion';
import TransactionCard from '../Transaction/TransactionCard';
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
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Budget Usage</span>
                    <span className={cn(
                        progress.percentage > 100 ? "text-red-500" : "text-emerald-500"
                    )}>
                        {progress.percentage.toFixed(1)}%
                    </span>
                </div>

                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "h-full rounded-full",
                            progress.percentage > 90 ? "bg-red-500" :
                                progress.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center text-sm">
                    <div className="p-2 rounded-lg bg-white/5">
                        <div className="text-muted-foreground text-xs mb-1">Total Budget</div>
                        <div className="font-bold text-foreground">${budget.amount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                        <div className="text-muted-foreground text-xs mb-1">Spent</div>
                        <div className="font-bold text-red-400">${progress.spent.toFixed(2)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                        <div className="text-muted-foreground text-xs mb-1">Remaining</div>
                        <div className={cn("font-bold", progress.remaining < 0 ? "text-red-500" : "text-emerald-500")}>
                            ${progress.remaining.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

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
                    <div className="text-center py-8 text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                        No transactions found for this budget
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetTransactionList;