import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWallet,
    faChartLine,
    faChartPie,
    faArrowTrendUp,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { getUserTransactions } from '../../services/transactionService';
import walletService from '../../services/walletService';
import { getUserBudgets } from '../../services/budgetService';
import './styles/dashboardUserShortAnalyticsStyles.css';

const DashboardUserShortAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalBalance: 0,
        totalWallets: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        budgetAdherence: 0
    });

    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (user && user.id) {
                try {
                    setLoading(true);

                    // Fetch all data
                    const [walletResponse, budgetResponse, transactionResponse] = await Promise.all([
                        walletService.getAllWallets(user.id),
                        getUserBudgets(user.id),
                        getUserTransactions(user.id)
                    ]);

                    // Initialize variables with safe defaults
                    const wallets = walletResponse?.data || [];
                    const budgets = budgetResponse?.data || [];
                    const transactions = transactionResponse?.data || [];

                    // Calculate total balance from wallets
                    const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
                    const totalWallets = wallets.length;

                    // Calculate monthly expenses
                    const currentMonth = new Date().getMonth();
                    const currentMonthTransactions = transactions.filter(t => {
                        const transactionMonth = new Date(t.date).getMonth();
                        return transactionMonth === currentMonth && t.type === 'expense';
                    });

                    const monthlyExpenses = currentMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Calculate savings rate
                    const monthlyIncome = transactions.filter(t => {
                        const transactionMonth = new Date(t.date).getMonth();
                        return transactionMonth === currentMonth && t.type === 'income';
                    }).reduce((sum, t) => sum + (t.amount || 0), 0);

                    const savingsRate = monthlyIncome > 0 
                        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
                        : 0;

                    // Calculate budget adherence
                    const budgetAdherence = budgets.length > 0 
                        ? budgets.reduce((acc, budget) => {
                            const spent = currentMonthTransactions
                                .filter(t => t.categoryId === budget.categoryId)
                                .reduce((sum, t) => sum + (t.amount || 0), 0);
                            return acc + (spent <= budget.amount ? 1 : 0);
                        }, 0) / budgets.length * 100
                        : 0;

                    setAnalytics({
                        totalBalance,
                        totalWallets,
                        monthlyExpenses,
                        savingsRate: Math.round(savingsRate),
                        budgetAdherence: Math.round(budgetAdherence)
                    });
                } catch (error) {
                    console.error('Error fetching analytics:', error);
                    // Set safe default values on error
                    setAnalytics({
                        totalBalance: 0,
                        totalWallets: 0,
                        monthlyExpenses: 0,
                        savingsRate: 0,
                        budgetAdherence: 0
                    });
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();
    }, [user]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const analyticsItems = [
        {
            title: 'Total Balance',
            value: formatCurrency(analytics.totalBalance),
            icon: faWallet,
            color: 'bg-blue-500'
        },
        {
            title: 'Total Wallets',
            value: analytics.totalWallets,
            icon: faWallet,
            color: 'bg-blue-500'
        },
        {
            title: 'Monthly Expenses',
            value: formatCurrency(analytics.monthlyExpenses),
            icon: faChartLine,
            color: 'bg-red-500'
        },
        {
            title: 'Savings Rate',
            value: `${analytics.savingsRate}%`,
            icon: faChartPie,
            color: 'bg-green-500'
        },
        {
            title: 'Budget Adherence',
            value: `${analytics.budgetAdherence}%`,
            icon: faArrowTrendUp,
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
                <div className="col-span-5 flex justify-center items-center p-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="text-2xl text-blue-500"
                    >
                        <FontAwesomeIcon icon={faSpinner} />
                    </motion.div>
                </div>
            ) : (
                analyticsItems.map((item, index) => (
                    <motion.div
                        key={item.title}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {item.title}
                                </h3>
                                <div className="mt-2 flex items-baseline">
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                            <div className={`p-3 rounded-full ${item.color}`}>
                                <FontAwesomeIcon 
                                    icon={item.icon} 
                                    className="h-6 w-6 text-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );
};

export default DashboardUserShortAnalytics;
