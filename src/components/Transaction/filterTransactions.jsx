import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

const FilterTransactions = ({
    filters,
    setFilters,
    wallets = [],
    savingsAccounts = [],
    categories = [],
}) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            minAmount: '',
            maxAmount: '',
            category: '',
            startDate: '',
            endDate: '',
            walletId: '',
            savingsAccountId: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

    return (
        <GlassCard className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-lg font-bold">
                    <Filter className="w-5 h-5 text-primary" />
                    Filters
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="w-4 h-4 mr-1" /> Clear All
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date Range</label>
                    <div className="flex gap-2">
                        <Input
                            type="month"
                            name="startDate"
                            value={filters.startDate || ''}
                            onChange={handleInputChange}
                            className="text-xs"
                        />
                        <Input
                            type="month"
                            name="endDate"
                            value={filters.endDate || ''}
                            onChange={handleInputChange}
                            className="text-xs"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select
                        name="category"
                        value={filters.category || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wallet</label>
                    <select
                        name="walletId"
                        value={filters.walletId || ''}
                        onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value) setFilters(prev => ({ ...prev, savingsAccountId: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                        <option value="">All Wallets</option>
                        {wallets.map(w => (
                            <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Savings</label>
                    <select
                        name="savingsAccountId"
                        value={filters.savingsAccountId || ''}
                        onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value) setFilters(prev => ({ ...prev, walletId: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                        <option value="">All Savings</option>
                        {savingsAccounts.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </GlassCard>
    );
};

export default FilterTransactions;
