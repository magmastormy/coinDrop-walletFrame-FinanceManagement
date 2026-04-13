import { useLogger } from '../../hooks/useLogger.jsx';

import React from 'react';

const FilterTransactions = ({
    filters,
    setFilters,
    wallets = [],
    savingsAccounts = [],
    categories = []
}) => {
    const hasActiveFilters = Object.values(filters).some(value => 
        value !== '' && value !== undefined && 
        !(typeof value === 'object' && Object.values(value).every(v => v === null || v === ''))
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Validate input length
        if (name === 'searchQuery' && value && value.length > 100) {
            logWarn('Search query too long, truncating to 100 characters');
            return;
        }
        
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };


    return (
        <div className="flex flex-wrap gap-4">
            {/* Date Range Filter */}
            <div className="space-y-1.5">
                <label 
                    className="text-[10px] uppercase tracking-widest font-bold ml-1"
                    style={{ color: 'var(--fc-on-tertiary-container)' }}
                >
                    Date Range
                </label>
                <div 
                    className="relative px-4 py-2.5 rounded-xl text-sm flex items-center transition-colors hover:bg-surface-container cursor-pointer"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-low)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                    onClick={(e) => {
                        const select = e.currentTarget.querySelector('select');
                        if (select) select.click();
                    }}
                >
                    <span className="material-symbols-outlined text-lg mr-3" style={{ color: 'var(--fc-primary)' }}>calendar_today</span>
                    <select
                        name="dateRange"
                        value={filters.dateRange || 'all'}
                        onChange={handleInputChange}
                        className="bg-transparent border-none focus:ring-0 text-sm cursor-pointer flex-1"
                        style={{ 
                            color: 'var(--fc-on-surface)',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <span className="material-symbols-outlined text-lg ml-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>expand_more</span>
                </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
                <label 
                    className="text-[10px] uppercase tracking-widest font-bold ml-1"
                    style={{ color: 'var(--fc-on-tertiary-container)' }}
                >
                    Category
                </label>
                <div 
                    className="relative px-4 py-2.5 rounded-xl text-sm flex items-center transition-colors hover:bg-surface-container cursor-pointer"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-low)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                    onClick={(e) => {
                        const select = e.currentTarget.querySelector('select');
                        if (select) select.click();
                    }}
                >
                    <span className="material-symbols-outlined text-lg mr-3" style={{ color: 'var(--fc-primary)' }}>category</span>
                    <select
                        name="category"
                        value={filters.category || ''}
                        onChange={handleInputChange}
                        className="bg-transparent border-none focus:ring-0 text-sm cursor-pointer flex-1"
                        style={{ 
                            color: 'var(--fc-on-surface)',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined text-lg ml-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>expand_more</span>
                </div>
            </div>

            {/* Wallet Filter */}
            <div className="space-y-1.5">
                <label 
                    className="text-[10px] uppercase tracking-widest font-bold ml-1"
                    style={{ color: 'var(--fc-on-tertiary-container)' }}
                >
                    Wallet
                </label>
                <div 
                    className="relative px-4 py-2.5 rounded-xl text-sm flex items-center transition-colors hover:bg-surface-container cursor-pointer"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-low)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                    onClick={(e) => {
                        const select = e.currentTarget.querySelector('select');
                        if (select) select.click();
                    }}
                >
                    <span className="material-symbols-outlined text-lg mr-3" style={{ color: 'var(--fc-primary)' }}>account_balance_wallet</span>
                    <select
                        name="walletId"
                        value={filters.walletId || ''}
                        onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value) setFilters(prev => ({ ...prev, savingsAccountId: '' }));
                        }}
                        className="bg-transparent border-none focus:ring-0 text-sm cursor-pointer flex-1"
                        style={{ 
                            color: 'var(--fc-on-surface)',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        <option value="">All Wallets</option>
                        {wallets.map(w => (
                            <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined text-lg ml-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>expand_more</span>
                </div>
            </div>

            {/* Savings Filter */}
            <div className="space-y-1.5">
                <label 
                    className="text-[10px] uppercase tracking-widest font-bold ml-1"
                    style={{ color: 'var(--fc-on-tertiary-container)' }}
                >
                    Savings
                </label>
                <div 
                    className="relative px-4 py-2.5 rounded-xl text-sm flex items-center transition-colors hover:bg-surface-container cursor-pointer"
                    style={{ 
                        backgroundColor: 'var(--fc-surface-container-low)',
                        border: '1px solid var(--fc-outline-variant)'
                    }}
                    onClick={(e) => {
                        const select = e.currentTarget.querySelector('select');
                        if (select) select.click();
                    }}
                >
                    <span className="material-symbols-outlined text-lg mr-3" style={{ color: 'var(--fc-primary)' }}>savings</span>
                    <select
                        name="savingsAccountId"
                        value={filters.savingsAccountId || ''}
                        onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value) setFilters(prev => ({ ...prev, walletId: '' }));
                        }}
                        className="bg-transparent border-none focus:ring-0 text-sm cursor-pointer flex-1"
                        style={{ 
                            color: 'var(--fc-on-surface)',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        <option value="">All Goals</option>
                        {savingsAccounts.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined text-lg ml-2" style={{ color: 'var(--fc-on-tertiary-container)' }}>expand_more</span>
                </div>
            </div>
        </div>
    );
};

export default FilterTransactions;
