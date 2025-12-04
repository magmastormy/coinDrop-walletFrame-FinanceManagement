import React from 'react';
import { Line } from 'react-chartjs-2';
import { Wallet, PiggyBank, TrendingUp, Percent } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTheme } from '../../theme/ThemeContext';
import { cn } from '../../lib/utils';

const SavingsAnalytics = ({ accounts }) => {
    const { theme } = useTheme();

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const totalGoals = accounts.reduce((sum, account) => sum + (account.goal || 0), 0);
    const goalProgress = totalGoals > 0 ? (totalBalance / totalGoals) * 100 : 0;

    const analyticsCards = [
        {
            title: 'Total Balance',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalBalance),
            icon: Wallet,
            trend: '+15%',
            trendUp: true,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Active Accounts',
            value: accounts.length,
            icon: PiggyBank,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            title: 'Total Goals',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalGoals),
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            title: 'Goal Progress',
            value: goalProgress.toFixed(1) + '%',
            icon: Percent,
            trend: '-5%',
            trendUp: false,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        }
    ];

    // Sample data for the line chart
    const chartData = {
        labels: ['Feb 9', 'Feb 10', 'Feb 11', 'Feb 12', 'Feb 13', 'Feb 14', 'Feb 15'],
        datasets: [
            {
                label: 'Balance Trend',
                data: [200, 250, 300, 350, 400, 450, 500],
                fill: true,
                borderColor: '#8b5cf6', // Primary purple
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            }
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
                Savings Analytics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {analyticsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <GlassCard key={index} className="p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {card.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {card.value}
                                    </h3>
                                </div>
                                <div className={cn("p-3 rounded-xl", card.bg, card.color)}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            {card.trend && (
                                <p className={cn(
                                    "text-sm font-medium",
                                    card.trendUp ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {card.trend}
                                </p>
                            )}
                        </GlassCard>
                    );
                })}
            </div>

            <GlassCard className="p-6 h-[300px]">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Balance Trend
                </h3>
                <div className="h-[calc(100%-40px)] w-full">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </GlassCard>
        </div>
    );
};

export default SavingsAnalytics;