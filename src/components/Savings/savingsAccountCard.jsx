import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Plus, Minus, MoreVertical, Edit, ArrowRightLeft, Trash } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useTheme } from '../../theme/ThemeContext';
import { cn } from '../../lib/utils';

const SavingsAccountCard = ({
    account,
    onDeposit,
    onWithdraw,
    onEdit,
    onTransfer,
    onDelete,
    onSelect,
    isSelected
}) => {
    const { isDarkMode } = useTheme();
    const [showMenu, setShowMenu] = useState(false);

    const formatCurrency = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(balance);
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleAction = (action, handler) => (e) => {
        e.stopPropagation();
        setShowMenu(false);
        handler(account._id);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showMenu]);

    return (
        <GlassCard
            className={cn(
                "relative h-[280px] flex flex-col p-6 transition-all duration-300 cursor-pointer group",
                isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-white/5"
            )}
            onClick={() => onSelect(account._id)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/20 text-primary">
                        <PiggyBank className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground truncate max-w-[150px]">
                        {account.name}
                    </h3>
                </div>

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMenuClick}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </Button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                            <button
                                onClick={handleAction('edit', onEdit)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/10 transition-colors"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={handleAction('transfer', onTransfer)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/10 transition-colors"
                            >
                                <ArrowRightLeft className="w-4 h-4" /> Transfer
                            </button>
                            <button
                                onClick={handleAction('delete', onDelete)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Balance */}
            <div className="flex-1 flex flex-col justify-center items-center text-center mb-6">
                <span className="text-sm text-muted-foreground mb-1">Current Balance</span>
                <h2 className="text-4xl font-bold text-foreground tracking-tight">
                    {formatCurrency(account.balance)}
                </h2>
                {account.goal > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Goal: {formatCurrency(account.goal)}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeposit(account._id);
                    }}
                >
                    <Plus className="w-4 h-4" /> Deposit
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30"
                    onClick={(e) => {
                        e.stopPropagation();
                        onWithdraw(account._id);
                    }}
                >
                    <Minus className="w-4 h-4" /> Withdraw
                </Button>
            </div>
        </GlassCard>
    );
};

export default SavingsAccountCard;
