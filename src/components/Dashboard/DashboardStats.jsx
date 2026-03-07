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
            bg: "bg-blue-500/10 border-blue-500/20",
            trend: "+2.5%", // Placeholder for real trend
            trendUp: true
        },
        {
            label: "Monthly Spend",
            value: formatCurrency(stats.monthlySpend),
            icon: TrendingUp,
            color: "text-red-500",
            bg: "bg-red-500/10 border-red-500/20",
            trend: "+12%",
            trendUp: false // Spending up is usually bad, but visually we might want to show it as 'up' arrow
        },
        {
            label: "Monthly Income",
            value: formatCurrency(stats.monthlyIncome),
            icon: Target,
            color: "text-green-500",
            bg: "bg-green-500/10 border-green-500/20",
            trend: "+5%",
            trendUp: true
        },
        {
            label: "Savings Rate",
            value: `${stats.savingsRate.toFixed(1)}%`,
            icon: PiggyBank,
            color: "text-purple-500",
            bg: "bg-purple-500/10 border-purple-500/20",
            trend: stats.savingsRate > 20 ? "Healthy" : "Low",
            trendUp: stats.savingsRate > 20
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-4 items-stretch">
            {statItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <GlassCard className="h-full min-h-[210px] border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 dark:from-white/10 dark:via-white/5">
                        <div className="flex h-full flex-col">
                            <div className="mb-4 flex items-start justify-between">
                                <div className={cn("rounded-2xl border p-3.5", item.bg, item.color)}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                                    item.trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {item.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {item.trend}
                                </div>
                            </div>

                            <div className="mt-auto rounded-2xl border border-white/10 bg-background/40 p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                                <h3 className="mt-2 text-3xl font-display font-bold text-foreground">{item.value}</h3>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            ))}
        </div>
    );
};

export default DashboardStats;
