import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Search, RefreshCw } from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import { getUserCategories } from '../../services/categoryService';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const TransactionStream = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const { user } = useSelector(state => state.auth);

    const fetchData = useCallback(async () => {
        if (user && user.id) {
            try {
                setLoading(true);
                const [transactionsResponse, categoriesResponse] = await Promise.all([
                    getUserTransactions(user.id),
                    getUserCategories(user.id)
                ]);
                setTransactions(transactionsResponse?.transactions || []);
                setCategories(categoriesResponse || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c._id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    const filteredTransactions = transactions
        .filter(t => {
            const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                getCategoryName(t.category?._id || t.category).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' || t.type === filterType;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-display font-bold text-foreground">Recent Activity</h3>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 rounded-xl border-white/15 bg-white/50 pl-9 dark:bg-black/20"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={fetchData}
                        className="h-10 w-10 rounded-xl border border-white/15"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['all', 'income', 'expense'].map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFilterType(type)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors",
                            filterType === type
                                ? "border-primary/35 bg-primary/15 text-primary"
                                : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredTransactions.length === 0 && !loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No transactions found
                    </div>
                ) : (
                    filteredTransactions.map((transaction, index) => (
                        <motion.div
                            key={transaction._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="group flex items-center justify-between border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-4 transition-colors hover:bg-white/60 dark:from-white/10 dark:via-white/5 dark:hover:bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                                        transaction.type === 'income'
                                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                            : "border-red-500/20 bg-red-500/10 text-red-500"
                                    )}>
                                        {transaction.type === 'income' ? (
                                            <ArrowDownLeft className="w-5 h-5" />
                                        ) : (
                                            <ArrowUpRight className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{transaction.description || 'Transaction'}</p>
                                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                            {new Date(transaction.date).toLocaleDateString()} • {getCategoryName(transaction.category?._id || transaction.category)}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "rounded-full border px-3 py-1 text-sm font-semibold",
                                    transaction.type === 'income'
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                        : "border-white/15 bg-background/50 text-foreground"
                                )}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </span>
                            </GlassCard>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionStream;
