import { logError } from '../../utils/logger';

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardStats from './DashboardStats';
import TransactionStream from './TransactionStream';
import { Loader2 } from 'lucide-react';
import PageHeader from '../Common/PageHeader';
import Card from '../ui/Card';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import { getUserTransactions } from '../../services/transactionService';
import walletService from '../../services/walletService';

// Lazy load charts
const DashboardBarChart = lazy(() => import('./dashboardBarChart'));
const DashboardPieChart = lazy(() => import('./dashboardPieChart'));
const DashboardRenderStocksPrices = lazy(() => import('./dashboardRenderStocksPrices'));

const DashboardManager = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('month');
    const [compareMode, setCompareMode] = useState(false);
    const [compareRange, setCompareRange] = useState('previous_period');
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
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                const prevMonthTx = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
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
    
    return (
        <>
            <PageHeader title="Dashboard">
                <div className="flex gap-4">
                    <Select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                    </Select>
                    <Toggle
                        label="Compare"
                        checked={compareMode}
                        onChange={() => setCompareMode(!compareMode)}
                    />
                    {compareMode && (
                        <Select
                            value={compareRange}
                            onChange={(e) => setCompareRange(e.target.value)}
                        >
                            <option value="previous_period">Previous Period</option>
                            <option value="year_ago">Year Ago</option>
                            <option value="custom">Custom Comparison</option>
                        </Select>
                    )}
                </div>
            </PageHeader>

            <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                {/* Hero Stats Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <DashboardStats 
                        dateRange={dateRange}
                        compareMode={compareMode}
                        compareRange={compareRange}
                    />
                </div>

                {/* Visual Charts & Savings Rate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Income vs Expense Chart Container */}
                    <div className="md:col-span-2 glass-card rounded-xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold font-headline">Income vs Expense</h3>
                                <p className="text-on-tertiary-container text-sm">Flow tracking for the current fiscal quarter</p>
                            </div>
                            <select className="bg-surface-container-low border-none text-sm rounded-lg px-4 py-2 text-on-surface-variant outline-none focus:ring-1 focus:ring-primary">
                                <option>Last 90 Days</option>
                                <option>Last 6 Months</option>
                                <option>Annual</option>
                            </select>
                        </div>
                        <div className="h-64">
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
                                <DashboardBarChart 
                                    dateRange={dateRange}
                                    compareMode={compareMode}
                                    compareRange={compareRange}
                                />
                            </Suspense>
                        </div>
                    </div>

                    {/* Savings Rate Card */}
                    <div className="glass-card rounded-xl p-8 flex flex-col justify-between border-t border-primary/10">
                        <div>
                            <h3 className="text-xl font-bold font-headline mb-1">Savings Rate</h3>
                            <p className="text-on-tertiary-container text-sm">Target: 40% per month</p>
                        </div>
                        <div className="relative flex items-center justify-center py-8">
                            <div className="w-40 h-40 rounded-full border-[12px] border-surface-container-low flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-4xl font-extrabold text-secondary">{stats?.savingsRate ? stats.savingsRate.toFixed(0) : '0'}%</span>
                                    <p className="text-[10px] text-on-tertiary-container uppercase tracking-widest mt-1">Achieved</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-44 h-44 -rotate-90">
                                    <circle className="text-secondary opacity-20" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="12"></circle>
                                    <circle className="text-secondary" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeDasharray="477" strokeDashoffset={477 - (477 * (stats?.savingsRate || 0) / 100)} strokeWidth="12"></circle>
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-on-tertiary-container">Projected Savings</span>
                                <span className="text-on-surface font-bold">+${stats?.monthlyIncome ? (stats.monthlyIncome * (stats.savingsRate / 100)).toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-on-tertiary-container">Remaining to Goal</span>
                                <span className="text-on-surface font-bold">${stats?.monthlyIncome ? (stats.monthlyIncome * (0.4 - (stats.savingsRate / 100))).toFixed(2) : '0.00'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity & Category Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity Section */}
                    <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
                        <div className="p-8 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-xl font-bold font-headline">Recent Activity</h3>
                            <div className="flex items-center bg-surface-container p-1 rounded-lg">
                                <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-secondary-container text-on-secondary-fixed">All</button>
                                <button className="px-4 py-1.5 text-xs font-bold rounded-md text-on-tertiary-container hover:text-on-surface transition-colors">Income</button>
                                <button className="px-4 py-1.5 text-xs font-bold rounded-md text-on-tertiary-container hover:text-on-surface transition-colors">Expense</button>
                            </div>
                        </div>
                        <div className="px-8 pb-8">
                            <TransactionStream 
                                dateRange={dateRange}
                            />
                            <div className="mt-4 pt-4 border-t border-outline-variant/10">
                                <button onClick={() => navigate('/transaction')} className="w-full text-center text-sm font-bold text-primary hover:text-on-primary-container transition-colors py-2">View Full Ledger</button>
                            </div>
                        </div>
                    </div>

                    {/* Spending by Category */}
                    <div className="glass-card rounded-xl p-8 flex flex-col">
                        <h3 className="text-xl font-bold font-headline mb-6">Spending Analysis</h3>
                        <div className="space-y-6 flex-1">
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
                                <DashboardPieChart 
                                    dateRange={dateRange}
                                    compareMode={compareMode}
                                />
                            </Suspense>
                        </div>
                        <div className="mt-8 bg-surface-container-low rounded-xl p-4 flex items-center space-x-4">
                            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                                <span className="material-symbols-outlined">lightbulb</span>
                            </div>
                            <p className="text-xs text-on-tertiary-container leading-relaxed">You spent <span className="text-on-surface font-bold">12% less</span> on Dining this month compared to last. Keep it up!</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardManager;
