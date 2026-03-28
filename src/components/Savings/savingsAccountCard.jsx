import React, { useState } from 'react';
import { PiggyBank, Plus, Minus, MoreVertical, Edit, ArrowRightLeft, Trash } from 'lucide-react';
import Button from '../ui/Button';

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
        <div
            className="group relative h-full min-h-[292px] cursor-pointer"
            style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                padding: '24px',
                transition: 'border-color 150ms ease',
            }}
            onClick={() => onSelect(account._id)}
        >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PiggyBank className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
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
                        <div
                            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden"
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-1)',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                        >
                            <button
                                onClick={handleAction('edit', onEdit)}
                                className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</span>
                            </button>
                            <button
                                onClick={handleAction('transfer', onTransfer)}
                                className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transfer</span>
                            </button>
                            <button
                                onClick={handleAction('delete', onDelete)}
                                className="w-full px-4 py-3 text-left text-sm text-red-400 transition-colors"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.10)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="flex items-center gap-2"><Trash className="w-4 h-4" /> Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Balance */}
            <div
                className="mb-5"
                style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    padding: '16px',
                }}
            >
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
            <div className="mt-auto flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2"
                    style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-1)',
                        color: 'var(--color-text-primary)',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeposit(account._id);
                    }}
                >
                    <Plus className="w-4 h-4" /> Deposit
                </Button>
                <Button
                    variant="outline"
                    className="h-9 flex-1 gap-2"
                    style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-1)',
                        color: 'var(--color-text-primary)',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onWithdraw(account._id);
                    }}
                >
                    <Minus className="w-4 h-4" /> Withdraw
                </Button>
            </div>
        </div>
    );
};

export default SavingsAccountCard;
