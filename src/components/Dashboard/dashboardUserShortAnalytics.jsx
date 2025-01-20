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
        budgetAdherence: 0,
        averageTransactionAmount: 0,
        mostFrequentCategory: '',
        yearlyExpenses: 0,
        yearlyIncome: 0,
        netWorthGrowthRate: 0,
        transactionVolume: 0
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
                            return acc + (spent <= budget.amount? 1 : 0);
                        }, 0) / budgets.length * 100
                        : 0;

                    // Calculate average transaction amount
                    const averageTransactionAmount = transactions.length > 0 
                       ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length 
                        : 0;

                    // Calculate most frequent category
                    const categoryCounts = {};
                    transactions.forEach(t => {
                        if (t.category) {
                            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
                        }
                    });
                    let mostFrequentCategory = null;
                    let maxCount = 0;
                    for (const [category, count] of Object.entries(categoryCounts)) {
                        if (count > maxCount) {
                            mostFrequentCategory = category;
                            maxCount = count;
                        }
                    }

                    // Calculate yearly expenses vs. income
                    const currentYear = new Date().getFullYear();
                    const yearlyExpenses = transactions.filter(t => {
                        const transactionYear = new Date(t.date).getFullYear();
                        return transactionYear === currentYear && t.type === 'expense';
                    }).reduce((sum, t) => sum + (t.amount || 0), 0);
                    const yearlyIncome = transactions.filter(t => {
                        const transactionYear = new Date(t.date).getFullYear();
                        return transactionYear === currentYear && t.type === 'income';
                    }).reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Calculate net worth growth rate
                    const startOfYear = new Date(currentYear, 0, 1);
                    const startBalance = wallets.reduce((sum, wallet) => {
                        if (wallet.date && new Date(wallet.date) < startOfYear) {
                            return sum + (wallet.balance || 0);
                        }
                        return sum;
                    }, 0);
                    const endBalance = totalBalance;
                    const netWorthGrowthRate = startBalance > 0 
                       ? ((endBalance - startBalance) / startBalance) * 100 
                        : 0;

                    // Calculate transaction volume
                    const transactionVolume = transactions.length;

                    setAnalytics({
                        totalBalance,
                        totalWallets,
                        monthlyExpenses,
                        savingsRate: Math.round(savingsRate),
                        budgetAdherence: Math.round(budgetAdherence),
                        averageTransactionAmount: averageTransactionAmount.toFixed(2),
                        mostFrequentCategory: mostFrequentCategory || 'N/A',
                        yearlyExpenses,
                        yearlyIncome,
                        netWorthGrowthRate: Math.round(netWorthGrowthRate),
                        transactionVolume
                    });
                } catch (error) {
                    console.error('Error fetching analytics:', error);
                    // Set safe default values on error
                    setAnalytics({
                        totalBalance: 0,
                        totalWallets: 0,
                        monthlyExpenses: 0,
                        savingsRate: 0,
                        budgetAdherence: 0,
                        averageTransactionAmount: 0,
                        mostFrequentCategory: '',
                        yearlyExpenses: 0,
                        yearlyIncome: 0,
                        netWorthGrowthRate: 0,
                        transactionVolume: 0
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
            color: 'blue'
        },
        {
            title: 'Monthly Expenses',
            value: formatCurrency(analytics.monthlyExpenses),
            icon: faChartLine,
            color: 'red'
        },
        {
            title: 'Savings & Budget',
            value: `${analytics.savingsRate}% | ${analytics.budgetAdherence}%`,
            icon: faChartPie,
            color: 'green'
        },
        {
            title: 'Average Transaction Amount',
            value: formatCurrency(analytics.averageTransactionAmount),
            icon: faArrowTrendUp,
            color: 'orange'
        },
        {
            title: 'Most Frequent Category',
            value: analytics.mostFrequentCategory,
            icon: faChartPie,
            color: 'purple'
        },
        {
            title: 'Yearly Expenses vs. Income',
            value: `${formatCurrency(analytics.yearlyExpenses)} vs. ${formatCurrency(analytics.yearlyIncome)}`,
            icon: faChartLine,
            color: 'teal'
        },
        {
            title: 'Net Worth Growth Rate',
            value: `${analytics.netWorthGrowthRate}%`,
            icon: faArrowTrendUp,
            color: 'pink'
        },
        {
            title: 'Transaction Volume',
            value: analytics.transactionVolume.toString(),
            icon: faChartLine,
            color: 'brown'
        }
    ];

    return (
        <div className="analytics-grid">
            {loading? (
                <div className="loading-container">
                    <motion.div
                        className="loading-icon"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <FontAwesomeIcon icon={faSpinner} />
                    </motion.div>
                </div>
            ) : (
                analyticsItems.map((item, index) => (
                    <motion.div
                        key={item.title}
                        className="analytics-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="analytics-card-header">
                            <h3 className="analytics-card-header-text">
                                {item.title}
                            </h3>
                        </div>
                        <div className="analytics-card-content">
                            <div className="analytics-value">
                                <p className="analytics-value-text">
                                    {item.value}
                                </p>
                            </div>
                            <div className={`analytics-icon ${item.color}`}>
                                <FontAwesomeIcon 
                                    icon={item.icon} 
                                    className="analytics-icon-svg"
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