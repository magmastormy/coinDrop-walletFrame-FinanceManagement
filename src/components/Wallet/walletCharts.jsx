import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const WalletChart = ({ wallets = [] }) => {
    const [timePeriod, setTimePeriod] = useState('monthly');
    const formatCurrencyHook = useCurrencyFormatter();

    // Filter wallets based on time period
    const filteredWallets = useMemo(() => {
        if (!Array.isArray(wallets) || wallets.length === 0) {
            return [];
        }
        
        const now = new Date();
        
        if (timePeriod === 'weekly') {
            // Show wallets updated in the last 7 days
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return wallets.filter(wallet => {
                if (!wallet.updatedAt) return false;
                const updatedDate = new Date(wallet.updatedAt);
                return updatedDate >= oneWeekAgo;
            });
        }
        
        // Monthly (default) - show all wallets
        return wallets;
    }, [wallets, timePeriod]);

    // Sort wallets by balance descending and take top 4
    const sortedWallets = useMemo(() => {
        if (!Array.isArray(wallets) || wallets.length === 0) {
            return [];
        }
        
        const walletsToSort = (filteredWallets && filteredWallets.length > 0) ? filteredWallets : (wallets || []);
        return [...walletsToSort]
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 4);
    }, [filteredWallets, wallets]);

    // Calculate max balance for scaling
    const maxBalance = useMemo(() => {
        if (!Array.isArray(sortedWallets) || sortedWallets.length === 0) {
            return 1;
        }
        return Math.max(...sortedWallets.map(w => w.balance || 0), 1);
    }, [sortedWallets]);

    // Calculate total balance for the period
    const totalBalance = useMemo(() => {
        return (sortedWallets || []).reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
    }, [sortedWallets]);

    if (!Array.isArray(wallets) || wallets.length === 0) {
        return null;
    }

    // Bar colors based on wallet type/index
    const getBarColor = (index) => {
        const colors = [
            { bg: 'bg-primary/20', fill: 'from-primary-fixed-dim to-on-primary-container' },
            { bg: 'bg-secondary/20', fill: 'bg-secondary' },
            { bg: 'bg-tertiary/20', fill: 'bg-tertiary' },
            { bg: 'bg-surface-variant', fill: 'bg-outline-variant' },
        ];
        return colors[index % colors.length];
    };

    // Get wallet label
    const getWalletLabel = (wallet, index) => {
        if (wallet.name) {
            // Return first word or first 4 chars
            const firstWord = wallet.name.split(' ')[0];
            return firstWord.length > 4 ? firstWord.substring(0, 4) : firstWord;
        }
        return `Wallet ${index + 1}`;
    };

    // Get period label
    const getPeriodLabel = () => {
        return timePeriod === 'weekly' ? 'Last 7 Days' : 'All Wallets';
    };

    return (
        <section className="bg-surface-container-high/60 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h3 className="text-2xl font-bold font-headline mb-1 text-on-surface">Wallet Balances</h3>
                    <p className="text-on-tertiary-container text-sm">
                        {timePeriod === 'weekly' 
                            ? 'Wallets with recent activity (last 7 days)' 
                            : 'Visual distribution of assets across primary wallets'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Period total */}
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-on-tertiary-container uppercase tracking-wider">{getPeriodLabel()}</p>
                        <p className="text-lg font-bold text-on-surface">{formatCurrencyHook(totalBalance)}</p>
                    </div>
                    <div className="flex bg-surface-container-lowest p-1 rounded-xl">
                        <button 
                            onClick={() => setTimePeriod('monthly')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                timePeriod === 'monthly' 
                                    ? 'bg-surface-container-highest text-on-surface' 
                                    : 'text-on-tertiary-container hover:text-on-surface'
                            }`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setTimePeriod('weekly')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                timePeriod === 'weekly' 
                                    ? 'bg-surface-container-highest text-on-surface' 
                                    : 'text-on-tertiary-container hover:text-on-surface'
                            }`}
                        >
                            Weekly
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty state for weekly filter */}
            {!sortedWallets.length && timePeriod === 'weekly' && (
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-on-tertiary-container text-sm mb-2">No wallets updated in the last 7 days</p>
                        <button 
                            onClick={() => setTimePeriod('monthly')}
                            className="text-primary text-sm hover:underline"
                        >
                            View all wallets
                        </button>
                    </div>
                </div>
            )}

            {/* Chart */}
            {sortedWallets.length > 0 && (
                <div className="h-64 flex items-end justify-between gap-4 px-4">
                    {sortedWallets.map((wallet, index) => {
                        const colors = getBarColor(index);
                        const heightPercentage = maxBalance > 0 
                            ? Math.max(((wallet.balance || 0) / maxBalance) * 100, 2) 
                            : 2;
                        
                        return (
                            <div key={wallet._id} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full relative">
                                    <div className={`w-full ${colors.bg} rounded-t-xl overflow-hidden h-48 relative`}>
                                        <motion.div 
                                            key={`${wallet._id}-${timePeriod}`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPercentage}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className={`absolute bottom-0 left-0 w-full ${
                                                index === 0 
                                                    ? 'bg-gradient-to-t from-primary-fixed-dim to-on-primary-container' 
                                                    : colors.fill
                                            } rounded-t-xl transition-all duration-500 group-hover:brightness-110`}
                                        />
                                        {/* Tooltip on hover */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-bold text-on-surface bg-surface-container-high/90 px-2 py-1 rounded">
                                                {formatCurrencyHook(wallet.balance || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-on-tertiary-container truncate w-full text-center">
                                    {getWalletLabel(wallet, index)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="mt-8 pt-8 border-t border-outline-variant/10 flex justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-fixed-dim to-on-primary-container"></div>
                    <span className="text-xs text-on-tertiary-container">Checking</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <span className="text-xs text-on-tertiary-container">Growth</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                    <span className="text-xs text-on-tertiary-container">Savings</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <span className="text-xs text-on-tertiary-container">Other</span>
                </div>
            </div>
        </section>
    );
};

export default WalletChart;
