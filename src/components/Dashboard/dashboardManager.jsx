import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import Greetings from './Greetings';
import DashboardStats from './DashboardStats';
import TransactionStream from './TransactionStream';
import { GlassCard } from '../ui/GlassCard';
import { Loader2 } from 'lucide-react';

// Lazy load charts
const DashboardBarChart = lazy(() => import('./dashboardBarChart'));
const DashboardPieChart = lazy(() => import('./dashboardPieChart'));
const DashboardRenderStocksPrices = lazy(() => import('./dashboardRenderStocksPrices'));

const DashboardManager = () => {
    return (
        <div className="space-y-8 pb-8">
            <Greetings />

            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area - Charts & Transactions */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="min-h-[300px] flex flex-col">
                            <h3 className="text-lg font-display font-bold mb-4">Income vs Expense</h3>
                            <div className="flex-1 relative">
                                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
                                    <DashboardBarChart />
                                </Suspense>
                            </div>
                        </GlassCard>
                        <GlassCard className="min-h-[300px] flex flex-col">
                            <h3 className="text-lg font-display font-bold mb-4">Spending by Category</h3>
                            <div className="flex-1 relative">
                                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
                                    <DashboardPieChart />
                                </Suspense>
                            </div>
                        </GlassCard>
                    </div>

                    <GlassCard>
                        <TransactionStream />
                    </GlassCard>
                </div>

                {/* Sidebar Area - Market Data & Quick Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="min-h-[400px]">
                        <h3 className="text-lg font-display font-bold mb-4">Market Trends</h3>
                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
                            <DashboardRenderStocksPrices />
                        </Suspense>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default DashboardManager;