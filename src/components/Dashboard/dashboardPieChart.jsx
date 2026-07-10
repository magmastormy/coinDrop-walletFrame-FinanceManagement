import { logError } from '../../utils/logger';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, PieChart } from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import { getUserCategories } from '../../services/categoryService';

const DashboardPieChart = () => {
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const [categoryData, setCategoryData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);
                    const [transactionsResponse, categoriesData] = await Promise.all([
                        getUserTransactions(user.id),
                        getUserCategories(user.id)
                    ]);

                    const transactionsData = transactionsResponse.transactions || [];
                    const expensesByCategory = {};

                    if (Array.isArray(transactionsData)) {
                        transactionsData.forEach(transaction => {
                            const txCategoryId = transaction.category?._id || transaction.category;
                            const category = categoriesData.find(c => c._id === txCategoryId);
                            if (category && transaction.type === 'expense') {
                                expensesByCategory[category.name] = (expensesByCategory[category.name] || 0) + transaction.amount;
                            }
                        });
                    }

                    if (Object.keys(expensesByCategory).length === 0) {
                        setCategoryData([]);
                    } else {
                        const totalExpense = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
                        const sortedCategories = Object.entries(expensesByCategory)
                            .map(([name, amount]) => ({
                                name,
                                amount,
                                percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
                            }))
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 4);

                        setCategoryData(sortedCategories);
                    }
                } catch (error) {
                    logError('Error fetching data:', error);
                    setCategoryData([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user]);

    const getCategoryColor = (index) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-error'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-on-tertiary-container">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p>Loading...</p>
            </div>
        );
    }

    if (categoryData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-on-tertiary-container">
                <PieChart className="w-12 h-12 mb-2 opacity-20" />
                <p>No expense data yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {categoryData.map((category, index) => (
                <div key={category.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-on-surface font-medium">{category.name}</span>
                        <span className="text-on-surface font-bold">{category.percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-2 rounded-full">
                        <div className={`${getCategoryColor(index)} h-full rounded-full`} style={{ width: `${category.percentage}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardPieChart;
