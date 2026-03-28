import React from 'react';
import {
    Wallet,
    CreditCard,
    Banknote,
    Coins,
    PiggyBank,
    Building2,
    HandCoins,
    FileCheck,
    TrendingUp,
    DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';

const icons = [
    { icon: Wallet, name: 'Wallet' },
    { icon: CreditCard, name: 'Credit Card' },
    { icon: Banknote, name: 'Cash' },
    { icon: Coins, name: 'Coins' },
    { icon: PiggyBank, name: 'Savings' },
    { icon: Building2, name: 'Bank' },
    { icon: HandCoins, name: 'Investment' },
    { icon: FileCheck, name: 'Check' },
    { icon: TrendingUp, name: 'Stocks' },
    { icon: DollarSign, name: 'Dollar' }
];

const CreateNewWalletIconOptions = ({ selectedIcon, onSelect }) => {
    return (
        <div className="grid grid-cols-5 gap-3">
            {icons.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.name;

                return (
                    <button
                        key={index}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                            isSelected && "bg-primary/20 ring-2 ring-primary"
                        )}
                        onClick={() => onSelect(item.name)}
                        onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-2)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                        type="button"
                        aria-label={`Select ${item.name} icon`}
                    >
                        <Icon className="w-[18px] h-[18px] text-foreground" strokeWidth={1.5} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CreateNewWalletIconOptions;
