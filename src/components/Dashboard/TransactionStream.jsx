import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import { getUserCategories } from '../../services/categoryService';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

const TransactionStream = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
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
                logError('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCategoryName = useCallback((categoryId) => {
        const category = categories.find(c => c._id === categoryId);
        return category ? category.name : 'Uncategorized';
    }, [categories]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const matchesFilter = filterType === 'all' || t.type === filterType;
                return matchesFilter;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 4);
    }, [transactions, filterType]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }, []);

    const getTransactionIcon = (transaction) => {
        const categoryName = getCategoryName(transaction.category?._id || transaction.category).toLowerCase();
        
        if (categoryName.includes('shopping') || categoryName.includes('clothing')) {
            return 'shopping_bag';
        } else if (categoryName.includes('income') || categoryName.includes('salary')) {
            return 'payments';
        } else if (categoryName.includes('food') || categoryName.includes('dining')) {
            return 'restaurant';
        } else if (categoryName.includes('utilities') || categoryName.includes('electric')) {
            return 'electric_bolt';
        } else {
            return transaction.type === 'income' ? 'payments' : 'shopping_bag';
        }
    };

    const getIconColor = (transaction) => {
        if (transaction.type === 'income') {
            return 'text-secondary';
        } else {
            const categoryName = getCategoryName(transaction.category?._id || transaction.category).toLowerCase();
            if (categoryName.includes('food') || categoryName.includes('dining')) {
                return 'text-tertiary';
            } else if (categoryName.includes('utilities') || categoryName.includes('electric')) {
                return 'text-error';
            } else {
                return 'text-primary';
            }
        }
    };

    const getIconBackground = (transaction) => {
        if (transaction.type === 'income') {
            return 'bg-secondary/10';
        } else {
            const categoryName = getCategoryName(transaction.category?._id || transaction.category).toLowerCase();
            if (categoryName.includes('food') || categoryName.includes('dining')) {
                return 'bg-tertiary/10';
            } else if (categoryName.includes('utilities') || categoryName.includes('electric')) {
                return 'bg-error/10';
            } else {
                return 'bg-primary/10';
            }
        }
    };

    return (
        <div className="space-y-1">
            {filteredTransactions.length === 0 && !loading ? (
                <div className="text-center py-8 text-on-tertiary-container">
                    No transactions found
                </div>
            ) : (
                filteredTransactions.map((transaction, index) => (
                    <motion.div
                        key={transaction._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: index * 0.03,
                            duration: 0.3,
                            ease: "easeOut"
                        }}
                    >
                        <div className="group flex items-center justify-between py-4 hover:bg-surface-container-high rounded-xl px-4 -mx-4 transition-all cursor-pointer">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl ${getIconBackground(transaction)} flex items-center justify-center ${getIconColor(transaction)}`}>
                                    <span className="material-symbols-outlined">{getTransactionIcon(transaction)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-on-surface">{transaction.description || 'Transaction'}</p>
                                    <p className="text-xs text-on-tertiary-container">{getCategoryName(transaction.category?._id || transaction.category)} • {new Date(transaction.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${transaction.type === 'income' ? 'text-secondary' : 'text-on-surface'}`}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-[10px] text-on-tertiary-container uppercase tracking-widest">
                                    {transaction.paymentMethod || 'Card'} • {transaction.cardLastFour || '****'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );
};

export default React.memo(TransactionStream);
