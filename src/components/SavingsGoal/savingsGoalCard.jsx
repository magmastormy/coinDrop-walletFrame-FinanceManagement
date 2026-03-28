import React, { useState } from 'react';
import {
    Target,
    Calendar,
    MoreVertical,
    Edit,
    Trash,
    Plus,
    CheckCircle2
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';
import { cn } from '../../lib/utils';

const SavingsGoalCard = ({ goal, onUpdate, onDelete, onContribute, wallets, milestones = [] }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isContributeOpen, setIsContributeOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [contributionAmount, setContributionAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [editForm, setEditForm] = useState({
        name: goal.name,
        targetAmount: goal.targetAmount,
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        color: goal.color || '#8b5cf6'
    });

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const isCompleted = progress >= 100;

    const handleContribute = (e) => {
        e.preventDefault();
        onContribute(goal._id, Number(contributionAmount), selectedWalletId);
        setIsContributeOpen(false);
        setContributionAmount('');
        setSelectedWalletId('');
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        onUpdate(goal._id, {
            ...editForm,
            targetAmount: Number(editForm.targetAmount)
        });
        setIsEditOpen(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    // Get goal image based on goal name (simplified for demo)
    const getGoalImage = (goalName) => {
        const images = {
            'home': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5WBgv8HVPmK3Sg8quGm4wbiaglzx-iaga9YWN9fQitlfi0nmTAdPJUdqNXK18QHbhNgYxAsNjWD2XC6Wl_vhR5_1CBE5-0NR89gX0R6gHo--gHCJt4YbP0Pufq0WEnHs9Qq39o5Ql5Qs8qwjmssY8llQ996OzPlPIxqw5XGOrnAlGu_Va0d-9gXkaQT_H6oHPfaiCZ8jg684prr7bBwSBShaUvAvfV2fvDzWwNDMUVWQJQiIXKS0_djmvBzjryYFvYT9G7351GGJB',
            'car': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbfNdnikCOMyXTQLD1n9dwbDcqGZTmkv2dAEXAKLJywzZUL6Pftue2YdUErBPunxy6SYlAxmRw1LX8_tDH_kv74LqUtg4h5zaLj5GaZVMYoDnmuAkexkZNIRgtdcd5qSpkdiKqJ7TD563d-VtkfSxxQcFnM0GupO7bjdHKhGNN7sznPYtV6TnbkcxJZd9fJrZW13eaZv1Wmm5XnqWmLPX5xLZkoZZtvXLUm3MHDnGaVSLQt_vyK2LmdeCEtl1dy2vKUAEeTSR1qs5F',
            'trip': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaeYbKniWUFVkGpB8FKYWzTSF9vmWxi7Ub24RIXjrqLE3YYZXvGXjo9b9HG00Y6W8LDmQQd8yE12VUoMfZlVdQVRG0SgsYSS7FMBS8zPA7F3uSZJlokhlvdyBh2qCxRWFyI_U3IAFcZqYCofmtsHzW3-Dq9JHaFi6gDP5So-DxKugVwwbsnC1e4TLprYH5sun5dWAI0TAEgb1-QzbT66tjP9LvaXqmSm6hAWAhYhzSAjrjIcG3fRVzKpRBRM3464qHPNISOHne2X2v'
        };
        
        const lowerName = goalName.toLowerCase();
        if (lowerName.includes('home')) return images.home;
        if (lowerName.includes('car') || lowerName.includes('ev')) return images.car;
        if (lowerName.includes('trip') || lowerName.includes('travel') || lowerName.includes('vacation')) return images.trip;
        return images.home; // Default image
    };

    // Get progress bar color based on progress
    const getProgressColor = () => {
        if (isCompleted) return 'bg-secondary';
        if (progress > 70) return 'bg-gradient-to-r from-primary to-on-primary-container';
        if (progress > 40) return 'bg-primary';
        return 'bg-tertiary';
    };

    // Get card border color based on progress
    const getBorderColor = () => {
        if (isCompleted) return 'border-secondary/20';
        if (progress > 70) return 'border-primary/20';
        if (progress > 40) return 'border-primary/10';
        return 'border-tertiary/20';
    };

    return (
        <>
            <div className="glass-panel p-6 rounded-[1.5rem] border border-white/5 flex items-center gap-6 group hover:border-primary/20 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center relative overflow-hidden shrink-0">
                    <img 
                        alt={goal.name} 
                        className="w-10 h-10 z-10" 
                        src={getGoalImage(goal.name)}
                    />
                    <div className={`absolute inset-0 ${getBorderColor()} group-hover:bg-primary/20 transition-colors`}></div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-lg text-white">{goal.name}</h4>
                            <p className="text-xs text-on-tertiary-container">Target date: {formatDate(goal.deadline)}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-white">{formatCurrency(goal.currentAmount)}</div>
                            <div className="text-[10px] text-on-tertiary-container uppercase tracking-widest font-bold">Of {formatCurrency(goal.targetAmount)}</div>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                        <div className={`h-full ${getProgressColor()} w-[${progress}%] rounded-full shadow-[0_0_12px_rgba(77,118,255,0.4)]`}></div>
                    </div>
                    {/* Milestones */}
                    {milestones.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {milestones.map((milestone, index) => (
                                <span key={index} className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                                    {milestone.milestone} achieved
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                    <button 
                        className="p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
                        onClick={() => setIsContributeOpen(true)}
                    >
                        <Plus className="w-[18px] h-[18px] text-primary" strokeWidth={1.5} />
                    </button>
                    <button 
                        className="p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical className="w-[18px] h-[18px] text-on-surface-variant" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Dropdown Menu */}
                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <div
                            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden shadow-xl"
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-surface-1)',
                            }}
                        >
                            <button
                                onClick={() => {
                                    setIsEditOpen(true);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="flex items-center gap-2"><Edit className="w-[18px] h-[18px]" strokeWidth={1.5} /> Edit Goal</span>
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(goal._id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-red-400 transition-colors"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="flex items-center gap-2"><Trash className="w-[18px] h-[18px]" strokeWidth={1.5} /> Delete Goal</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Contribute Modal */}
            <Modal
                isOpen={isContributeOpen}
                onClose={() => setIsContributeOpen(false)}
                title={`Contribute to ${goal.name}`}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleContribute} className="space-y-4">
                    <Input
                        label="Amount"
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">From Wallet</label>
                        <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '14px',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            <option value="">Select a wallet</option>
                            {wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name} ({formatCurrency(wallet.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Button variant="ghost" type="button" onClick={() => setIsContributeOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!contributionAmount || !selectedWalletId}>
                            Confirm Contribution
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Goal"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <Input
                        label="Goal Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                    />

                    <Input
                        label="Target Amount"
                        type="number"
                        value={editForm.targetAmount}
                        onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                        min="0"
                        step="0.01"
                        required
                    />

                    <Input
                        label="Deadline"
                        type="date"
                        value={editForm.deadline}
                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    />

                    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default SavingsGoalCard;
