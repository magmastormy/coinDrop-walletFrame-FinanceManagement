import React, { useState } from 'react';
import { PiggyBank, Plus, Minus, MoreVertical, Edit, ArrowRightLeft, Trash } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
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
                "group relative h-full min-h-[292px] cursor-pointer border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 transition-all duration-300 hover:translate-y-[-4px] dark:from-white/10 dark:via-white/5",
                isSelected ? "ring-2 ring-primary/60 bg-primary/5" : "hover:bg-white/5"
            )}
            onClick={() => onSelect(account._id)}
        >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-cyan-400/15 p-3.5 text-emerald-500">
                        <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="max-w-[170px] truncate text-lg font-semibold text-foreground">
                            {account.name}
                        </h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Savings Account</p>
                    </div>
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
                        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/20 bg-card shadow-xl backdrop-blur-xl">
                            <button
                                onClick={handleAction('edit', onEdit)}
                                className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/10"
                            >
                                <span className="flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</span>
                            </button>
                            <button
                                onClick={handleAction('transfer', onTransfer)}
                                className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/10"
                            >
                                <span className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transfer</span>
                            </button>
                            <button
                                onClick={handleAction('delete', onDelete)}
                                className="w-full px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                            >
                                <span className="flex items-center gap-2"><Trash className="w-4 h-4" /> Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Balance */}
            <div className="mb-5 rounded-2xl border border-white/10 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current Balance</p>
                <h2 className="mt-2 text-3xl font-display font-bold text-foreground tracking-tight">
                    {formatCurrency(account.balance)}
                </h2>
                {account.goal > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Goal: {formatCurrency(account.goal)}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="mt-auto flex gap-3 border-t border-white/10 pt-4">
                <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeposit(account._id);
                    }}
                >
                    <Plus className="w-4 h-4" /> Deposit
                </Button>
                <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2 border-red-500/20 bg-red-500/10 text-red-500 hover:border-red-500/30 hover:bg-red-500/20"
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
