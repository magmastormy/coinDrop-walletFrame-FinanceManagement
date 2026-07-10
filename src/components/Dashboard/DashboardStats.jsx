import { logError } from '../../utils/logger';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, PiggyBank, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { getUserTransactions } from '../../services/transactionService';
import walletService from '../../services/walletService';
import Card from '../ui/Card';

const DashboardStats = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlySpend: 0,
        savingsRate: 0,
        monthlyIncome: 0,
        prevMonthlySpend: 0,
        prevMonthlyIncome: 0,
        prevSavingsRate: 0
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

                const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
                const prevMonth = prevMonthDate.getMonth();
                const prevYear = prevMonthDate.getFullYear();

                const monthTx = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d && !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                const prevMonthTx = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d && !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
                });

                const monthlySpend = monthTx
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const monthlyIncome = monthTx
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const prevMonthlySpend = prevMonthTx
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const prevMonthlyIncome = prevMonthTx
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                const savingsRate = monthlyIncome > 0
                    ? ((monthlyIncome - monthlySpend) / monthlyIncome) * 100
                    : 0;

                const prevSavingsRate = prevMonthlyIncome > 0
                    ? ((prevMonthlyIncome - prevMonthlySpend) / prevMonthlyIncome) * 100
                    : 0;

                setStats({
                    totalBalance,
                    monthlySpend,
                    monthlyIncome,
                    savingsRate: Math.max(0, savingsRate),
                    prevMonthlySpend,
                    prevMonthlyIncome,
                    prevSavingsRate: Math.max(0, prevSavingsRate)
                });
            } catch (error) {
                logError('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, [user]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatPercent = useCallback((value) => {
        return `${Math.abs(value).toFixed(1)}%`;
    }, []);

    const statItems = useMemo(() => {
        const netCashflow = stats.monthlyIncome - stats.monthlySpend;
        const prevNetCashflow = stats.prevMonthlyIncome - stats.prevMonthlySpend;

        return [
            {
                id: 'balance',
                title: 'Total Balance',
                value: formatCurrency(stats.totalBalance),
                icon: Wallet,
                change: formatCurrency(Math.abs(netCashflow - prevNetCashflow)),
                isPositive: netCashflow >= prevNetCashflow,
                changeType: 'currency',
                size: '2x2',
                color: 'primary'
            },
            {
                id: 'spending',
                title: 'Monthly Spend',
                value: formatCurrency(stats.monthlySpend),
                icon: TrendingUp,
                change: formatCurrency(Math.abs(stats.monthlySpend - stats.prevMonthlySpend)),
                isPositive: stats.monthlySpend <= stats.prevMonthlySpend,
                changeType: 'currency',
                size: '1x1',
                color: 'warning'
            },
            {
                id: 'income',
                title: 'Monthly Income',
                value: formatCurrency(stats.monthlyIncome),
                icon: Target,
                change: formatCurrency(Math.abs(stats.monthlyIncome - stats.prevMonthlyIncome)),
                isPositive: stats.monthlyIncome >= stats.prevMonthlyIncome,
                changeType: 'currency',
                size: '1x1',
                color: 'success'
            },
            {
                id: 'savings',
                title: 'Savings Rate',
                value: formatPercent(stats.savingsRate),
                icon: PiggyBank,
                change: formatPercent(stats.savingsRate - stats.prevSavingsRate),
                isPositive: stats.savingsRate >= stats.prevSavingsRate,
                changeType: 'percent',
                size: '1x1',
                color: 'info'
            }
        ];
    }, [formatCurrency, formatPercent, stats]);

    const getChangeIcon = (isPositive) => {
        return isPositive ? ArrowUp : ArrowDown;
    };

    return (
        <>
            {/* Main Balance Card */}
            <div className="md:col-span-2 glass-card rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="z-10">
                    <p className="text-on-tertiary-container text-sm font-semibold tracking-wider uppercase">Total Balance</p>
                    <h2 className="text-6xl font-extrabold font-headline mt-2 text-primary">${stats.totalBalance.toFixed(2).split('.')[0]}<span className="text-3xl font-medium opacity-50">.{(stats.totalBalance.toFixed(2).split('.')[1] || '00')}</span></h2>
                    <div className="flex items-center mt-4 text-secondary space-x-1">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        <span className="text-sm font-bold">{formatPercent(Math.abs(stats.prevMonthlyIncome - stats.prevMonthlySpend) > 0.01 ? ((stats.monthlyIncome - stats.monthlySpend) - (stats.prevMonthlyIncome - stats.prevMonthlySpend)) / Math.abs(stats.prevMonthlyIncome - stats.prevMonthlySpend) * 100 : 0)} from last month</span>
                    </div>
                </div>
                <div className="mt-8 flex space-x-4 z-10">
                    <button onClick={() => navigate('/transaction')} className="bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-bright transition-colors">View Report</button>
                    <button onClick={() => navigate('/wallet')} className="bg-primary/10 px-4 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-colors">Manage Assets</button>
                </div>
            </div>

            {/* Monthly Metrics */}
            <div className="glass-card rounded-xl p-6 flex flex-col justify-center space-y-2 border-l-4 border-secondary/30">
                <p className="text-on-tertiary-container text-xs font-semibold tracking-wider uppercase">Monthly Income</p>
                <div className="flex items-baseline space-x-2">
                    <h3 className="text-2xl font-bold font-headline text-on-surface">${stats.monthlyIncome.toFixed(0)}</h3>
                    <span className={`text-${stats.monthlyIncome >= stats.prevMonthlyIncome ? 'secondary' : 'error'} text-xs font-bold`}>
                        {stats.monthlyIncome >= stats.prevMonthlyIncome ? '+' : ''}{formatPercent(Math.abs(stats.prevMonthlyIncome) > 0 ? (stats.monthlyIncome - stats.prevMonthlyIncome) / Math.abs(stats.prevMonthlyIncome) * 100 : 0)}
                    </span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-4">
                    <div className="bg-secondary h-full rounded-full" style={{ width: Math.min(100, (stats.monthlyIncome + stats.monthlySpend) > 0 ? (stats.monthlyIncome / (stats.monthlyIncome + stats.monthlySpend)) * 100 : 0) + '%' }}></div>
                </div>
            </div>
            <div className="glass-card rounded-xl p-6 flex flex-col justify-center space-y-2 border-l-4 border-error/30">
                <p className="text-on-tertiary-container text-xs font-semibold tracking-wider uppercase">Monthly Spend</p>
                <div className="flex items-baseline space-x-2">
                    <h3 className="text-2xl font-bold font-headline text-on-surface">${stats.monthlySpend.toFixed(0)}</h3>
                    <span className={`text-${stats.monthlySpend <= stats.prevMonthlySpend ? 'secondary' : 'error'} text-xs font-bold`}>
                        {stats.monthlySpend <= stats.prevMonthlySpend ? '-' : '+'}{formatPercent(Math.abs(stats.prevMonthlySpend) > 0 ? (stats.monthlySpend - stats.prevMonthlySpend) / Math.abs(stats.prevMonthlySpend) * 100 : 0)}
                    </span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-4">
                    <div className="bg-error h-full rounded-full" style={{ width: Math.min(100, (stats.monthlyIncome + stats.monthlySpend) > 0 ? (stats.monthlySpend / (stats.monthlyIncome + stats.monthlySpend)) * 100 : 0) + '%' }}></div>
                </div>
            </div>
        </>
    );
};

export default DashboardStats;
