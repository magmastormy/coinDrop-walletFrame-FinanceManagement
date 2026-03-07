import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import walletService from '../../services/walletService';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

const DashboardStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlySpend: 0,
        savingsRate: 0,
        monthlyIncome: 0
    });
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                const [walletsRes, transactionsRes] = await Promise.all([
                    walletService.getAllWallets(user.id),
                    getUserTransactions(user.id)
                ]);

                const wallets = walletsRes || [];
                const transactions = transactionsRes?.transactions || [];

                const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const monthTx = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                const monthlySpend = monthTx
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const monthlyIncome = monthTx
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const savingsRate = monthlyIncome > 0
                    ? ((monthlyIncome - monthlySpend) / monthlyIncome) * 100
                    : 0;

                setStats({
                    totalBalance,
                    monthlySpend,
                    monthlyIncome,
                    savingsRate: Math.max(0, savingsRate)
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const statItems = [
        {
            label: "Total Balance",
            value: formatCurrency(stats.totalBalance),
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "+2.5%", // Placeholder for real trend
            trendUp: true
        },
        {
            label: "Monthly Spend",
            value: formatCurrency(stats.monthlySpend),
            icon: TrendingUp,
            color: "text-red-500",
            bg: "bg-red-500/10",
            trend: "+12%",
            trendUp: false // Spending up is usually bad, but visually we might want to show it as 'up' arrow
        },
        {
            label: "Monthly Income",
            value: formatCurrency(stats.monthlyIncome),
            icon: Target,
            color: "text-green-500",
            bg: "bg-green-500/10",
            trend: "+5%",
            trendUp: true
        },
        {
            label: "Savings Rate",
            value: `${stats.savingsRate.toFixed(1)}%`,
            icon: PiggyBank,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            trend: stats.savingsRate > 20 ? "Healthy" : "Low",
            trendUp: stats.savingsRate > 20
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <GlassCard className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl", item.bg, item.color)}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                item.trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {item.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {item.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
                            <h3 className="text-2xl font-display font-bold text-foreground mt-1">{item.value}</h3>
                        </div>
                    </GlassCard>
                </motion.div>
            ))}
        </div>
    );
};

export default DashboardStats;
