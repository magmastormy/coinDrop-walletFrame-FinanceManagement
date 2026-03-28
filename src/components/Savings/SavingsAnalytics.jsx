import React, { useEffect, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Wallet, PiggyBank, TrendingUp, Percent } from 'lucide-react';
import { cn } from '../../lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SavingsAnalytics = ({ accounts }) => {

    const safeAccounts = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);

    const totalBalance = safeAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const totalGoals = safeAccounts.reduce((sum, account) => sum + Number(account.goal || 0), 0);
    const goalProgress = totalGoals > 0 ? (totalBalance / totalGoals) * 100 : 0;

    const calculateBalanceTrend = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        let totalBalanceNow = totalBalance;
        let totalBalanceThirtyDaysAgo = 0;

        safeAccounts.forEach(account => {
            if (Array.isArray(account.transactions)) {
                const thirtyDaysAgoBalance = account.transactions
                    .filter(t => new Date(t.date) <= thirtyDaysAgo)
                    .reduce((balance, t) => {
                        const amount = Number(t.amount || 0);
                        return t.type === 'income' || t.type === 'deposit' 
                            ? balance + amount 
                            : balance - amount;
                    }, Number(account.initialBalance || 0));
                totalBalanceThirtyDaysAgo += thirtyDaysAgoBalance;
            } else {
                totalBalanceThirtyDaysAgo += Number(account.initialBalance || 0);
            }
        });

        if (totalBalanceThirtyDaysAgo > 0) {
            const trend = ((totalBalanceNow - totalBalanceThirtyDaysAgo) / totalBalanceThirtyDaysAgo) * 100;
            return {
                trend: trend.toFixed(1) + '%',
                trendUp: trend > 0
            };
        }
        return { trend: '0%', trendUp: false };
    };

    const calculateGoalProgressTrend = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        let totalBalanceNow = totalBalance;
        let totalBalanceThirtyDaysAgo = 0;

        safeAccounts.forEach(account => {
            if (Array.isArray(account.transactions)) {
                const thirtyDaysAgoBalance = account.transactions
                    .filter(t => new Date(t.date) <= thirtyDaysAgo)
                    .reduce((balance, t) => {
                        const amount = Number(t.amount || 0);
                        return t.type === 'income' || t.type === 'deposit' 
                            ? balance + amount 
                            : balance - amount;
                    }, Number(account.initialBalance || 0));
                totalBalanceThirtyDaysAgo += thirtyDaysAgoBalance;
            } else {
                totalBalanceThirtyDaysAgo += Number(account.initialBalance || 0);
            }
        });

        const currentProgress = totalGoals > 0 ? (totalBalanceNow / totalGoals) * 100 : 0;
        const thirtyDaysAgoProgress = totalGoals > 0 ? (totalBalanceThirtyDaysAgo / totalGoals) * 100 : 0;
        
        const trend = currentProgress - thirtyDaysAgoProgress;
        return {
            trend: trend.toFixed(1) + '%',
            trendUp: trend > 0
        };
    };

    const balanceTrend = calculateBalanceTrend();
    const goalProgressTrend = calculateGoalProgressTrend();

    const analyticsCards = [
        {
            title: 'Total Balance',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalBalance),
            icon: Wallet,
            trend: balanceTrend.trend,
            trendUp: balanceTrend.trendUp,
        },
        {
            title: 'Active Accounts',
            value: safeAccounts.length,
            icon: PiggyBank,
        },
        {
            title: 'Total Goals',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalGoals),
            icon: TrendingUp,
        },
        {
            title: 'Goal Progress',
            value: goalProgress.toFixed(1) + '%',
            icon: Percent,
            trend: goalProgressTrend.trend,
            trendUp: goalProgressTrend.trendUp,
        }
    ];

    const { labels, series } = useMemo(() => {
        const accountWithHistory = safeAccounts
            .filter(acc => Array.isArray(acc.transactions) && acc.transactions.length > 0)
            .sort((a, b) => (b.transactions?.length || 0) - (a.transactions?.length || 0))[0];

        if (!accountWithHistory) {
            const now = new Date();
            const fallbackLabels = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(now);
                d.setDate(now.getDate() - (6 - i));
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            return {
                labels: fallbackLabels,
                series: Array.from({ length: 7 }, () => totalBalance),
            };
        }

        const currentBalance = Number(accountWithHistory.balance || 0);
        const txns = [...accountWithHistory.transactions]
            .filter(Boolean)
            .map(t => ({
                ...t,
                amount: Number(t.amount || 0),
                date: t.date || t.createdAt || t.timestamp,
            }))
            .filter(t => t.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const deltas = txns.map(t => {
            const type = String(t.type || '').toLowerCase();
            if (type === 'income' || type === 'deposit') return t.amount;
            if (type === 'expense' || type === 'withdraw') return -t.amount;
            return 0;
        });

        const totalDelta = deltas.reduce((sum, d) => sum + d, 0);
        let running = currentBalance - totalDelta;

        const points = txns.map((t, idx) => {
            running += deltas[idx];
            return {
                label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: running,
            };
        });

        const lastPoints = points.slice(-14);
        return {
            labels: lastPoints.map(p => p.label),
            series: lastPoints.map(p => p.value),
        };
    }, [safeAccounts, totalBalance]);

    const chartData = useMemo(() => ({
        labels,
        datasets: [
            {
                label: 'Balance Trend',
                data: series,
                fill: true,
                borderColor: 'var(--color-gold)',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                tension: 0.35,
                pointBackgroundColor: 'var(--color-gold)',
                pointBorderColor: 'var(--color-surface-1)',
                pointHoverBackgroundColor: 'var(--color-surface-1)',
                pointHoverBorderColor: 'var(--color-gold)'
            }
        ]
    }), [labels, series]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    color: 'rgba(0,0,0,0)'
                },
                ticks: {
                    color: 'var(--color-text-muted)'
                }
            },
            y: {
                grid: {
                    color: 'var(--color-border)'
                },
                ticks: {
                    color: 'var(--color-text-muted)'
                }
            }
        }
    };

    return (
        <div className="mb-8">
            <h2
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px',
                }}
            >
                Savings Analytics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {analyticsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="flex flex-col justify-between"
                            style={{
                                height: '120px',
                                padding: '24px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-surface-1)',
                                transition: 'border-color 150ms ease',
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {card.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {card.value}
                                    </h3>
                                </div>
                                <Icon
                                    className="w-[18px] h-[18px]"
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                />
                            </div>
                            {card.trend && (
                                <p className={cn(
                                    "text-sm font-medium",
                                    card.trendUp ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {card.trend}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div
                className="h-[300px]"
                style={{
                    padding: '24px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                }}
            >
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Balance Trend
                </h3>
                <div className="h-[calc(100%-40px)] w-full">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default SavingsAnalytics;
