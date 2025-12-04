import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    PieChart,
    DollarSign,
    AlertTriangle,
    PiggyBank,
    Loader2
} from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import walletService from '../../services/walletService';
import { getUserBudgets } from '../../services/budgetService';
import { Button } from '../ui/Button';


const DashboardUserShortAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState({
        totalBalance: 0,
        totalWallets: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        budgetAdherence: 0,
        mostFrequentCategory: '',
        yearlyExpensesVsIncome: { expenses: 0, income: 0 },
        netWorthGrowthRate: 0
    });

    const { user } = useSelector(state => state.auth);

    const fetchAnalytics = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all data
            const [walletResponse, budgetResponse, transactionResponse] = await Promise.allSettled([
                walletService.getAllWallets(user.id),
                getUserBudgets(user.id),
                getUserTransactions(user.id)
            ]);

            // Process results safely with error handling
            const wallets = walletResponse.status === 'fulfilled' ? walletResponse.value?.wallets || [] : [];
            const budgets = budgetResponse.status === 'fulfilled' ? budgetResponse.value?.budgets || [] : [];
            const transactions = transactionResponse.status === 'fulfilled'
                ? transactionResponse.value?.transactions || []
                : [];

            // Calculate total balance from wallets
            const totalBalance = wallets.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);
            const totalWallets = wallets.length;

            // Calculate monthly metrics
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

            const currentMonthExpenses = transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= firstDayOfMonth && t.type === 'expense';
            });

            const currentMonthIncome = transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= firstDayOfMonth && t.type === 'income';
            });

            const monthlyExpenses = currentMonthExpenses.reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
            const monthlyIncome = currentMonthIncome.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            // Calculate savings rate
            const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

            // Calculate budget adherence
            let budgetAdherence = 100;
            if (budgets.length > 0) {
                const budgetsInBudget = budgets.filter(b => {
                    const budgetExpenses = currentMonthExpenses
                        .filter(t => t.category === b.category)
                        .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
                    return budgetExpenses <= b.amount;
                });
                budgetAdherence = (budgetsInBudget.length / budgets.length) * 100;
            }

            // Calculate most frequent category
            const categoryCount = {};
            transactions.forEach(t => {
                if (t.category) {
                    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
                }
            });
            const mostFrequentCategory = Object.keys(categoryCount).length > 0
                ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
                : '';

            // Calculate yearly expenses vs income
            const startOfYear = new Date(currentYear, 0, 1);
            const yearlyExpenses = transactions
                .filter(t => new Date(t.date) >= startOfYear && t.type === 'expense')
                .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
            const yearlyIncome = transactions
                .filter(t => new Date(t.date) >= startOfYear && t.type === 'income')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            // Calculate net worth growth rate
            const currentNetWorth = totalBalance;
            let startOfYearNetWorth = currentNetWorth;

            // For each wallet, adjust the starting net worth based on this year's transactions
            wallets.forEach(wallet => {
                // Get all transactions for this wallet from this year
                const walletYearTransactions = transactions.filter(t =>
                    new Date(t.date) >= startOfYear &&
                    t.walletId === wallet._id
                );

                // Calculate net effect of this year's transactions
                const yearNetChange = walletYearTransactions.reduce((net, t) => {
                    if (t.type === 'income') {
                        return net + (Number(t.amount) || 0);
                    } else if (t.type === 'expense') {
                        return net - (Math.abs(Number(t.amount)) || 0);
                    }
                    return net;
                }, 0);

                // Subtract the net change to get start of year value
                startOfYearNetWorth -= yearNetChange;
            });

            // Calculate growth rate
            const netWorthGrowthRate = startOfYearNetWorth > 0
                ? ((currentNetWorth - startOfYearNetWorth) / startOfYearNetWorth) * 100
                : (currentNetWorth > 0 ? 100 : 0); // If we started with 0, any positive is 100% growth

            setAnalytics({
                totalBalance,
                totalWallets,
                monthlyExpenses,
                savingsRate: Number(savingsRate.toFixed(1)),
                budgetAdherence: Number(budgetAdherence.toFixed(1)),
                mostFrequentCategory,
                yearlyExpensesVsIncome: {
                    expenses: yearlyExpenses,
                    income: yearlyIncome,
                    ratio: yearlyIncome > 0 ? (yearlyExpenses / yearlyIncome) * 100 : 0
                },
                netWorthGrowthRate: Number(netWorthGrowthRate.toFixed(1))
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load financial data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    // Icon mapping for lucide-react
    const iconMap = {
        'Wallet': Wallet,
        'DollarSign': DollarSign,
        'PiggyBank': PiggyBank,
        'PieChart': PieChart,
        'TrendingUp': TrendingUp,
        'TrendingUp2': TrendingUp
    };

    // More focused, important analytics items
    const analyticsItems = [
        {
            title: 'Total Balance',
            value: formatCurrency(analytics.totalBalance),
            icon: 'Wallet',
            color: 'blue',
            tooltip: `Across ${analytics.totalWallets} wallets`
        },
        {
            title: 'Monthly Expenses',
            value: formatCurrency(analytics.monthlyExpenses),
            icon: 'DollarSign',
            color: 'red',
            tooltip: 'Total spending this month'
        },
        {
            title: 'Savings Rate',
            value: `${analytics.savingsRate}%`,
            icon: 'PiggyBank',
            color: 'green',
            tooltip: 'Portion of income saved this month'
        },
        {
            title: 'Budget Adherence',
            value: `${analytics.budgetAdherence}%`,
            icon: 'PieChart',
            color: 'purple',
            tooltip: "Percentage of budgets you're staying within"
        },
        {
            title: 'Yearly Income vs Expenses',
            value: analytics.yearlyExpensesVsIncome.ratio > 0
                ? `${analytics.yearlyExpensesVsIncome.ratio.toFixed(0)} % `
                : 'N/A',
            icon: 'TrendingUp',
            color: analytics.yearlyExpensesVsIncome.ratio <= 90 ? 'green' :
                analytics.yearlyExpensesVsIncome.ratio <= 100 ? 'orange' : 'red',
            tooltip: `Spending ${formatCurrency(analytics.yearlyExpensesVsIncome.expenses)} of ${formatCurrency(analytics.yearlyExpensesVsIncome.income)} income`
        },
        {
            title: 'Net Worth Growth',
            value: `${analytics.netWorthGrowthRate} % `,
            icon: 'TrendingUp2',
            color: analytics.netWorthGrowthRate >= 0 ? 'green' : 'red',
            tooltip: 'Growth in your net worth since the start of the year'
        }
    ];

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchAnalytics} size="sm">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="analytics-grid">
            {loading ? (
                <div className="flex flex-col items-center justify-center col-span-full p-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground mt-4">Loading your financial insights...</p>
                </div>
            ) : (
                analyticsItems.map((item, index) => {
                    const IconComponent = iconMap[item.icon];
                    return (
                        <motion.div
                            key={item.title}
                            className="analytics-card group relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            title={item.tooltip}
                        >
                            <div
                                className="card-icon"
                                style={{ backgroundColor: `var(--${item.color} -color)` }}
                            >
                                <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="card-content">
                                <h3>{item.title}</h3>
                                <p className="card-value">{item.value}</p>
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {item.tooltip}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    );
};

export default DashboardUserShortAnalytics;