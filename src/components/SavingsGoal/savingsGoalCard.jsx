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
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';
import { cn } from '../../lib/utils';

const SavingsGoalCard = ({ goal, onUpdate, onDelete, onContribute, wallets }) => {
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
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <>
            <GlassCard className="group relative flex h-full min-h-[292px] flex-col border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 transition-all duration-300 hover:translate-y-[-4px] dark:from-white/10 dark:via-white/5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "rounded-2xl border p-3.5",
                            isCompleted
                                ? "border-emerald-500/20 bg-emerald-500/20 text-emerald-500"
                                : "border-primary/20 bg-primary/20 text-primary"
                        )}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground line-clamp-1">{goal.name}</h3>
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(goal.deadline)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMenu(!showMenu)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/20 bg-card shadow-xl backdrop-blur-xl">
                                    <button
                                        onClick={() => {
                                            setIsEditOpen(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/10"
                                    >
                                        <span className="flex items-center gap-2"><Edit className="w-4 h-4" /> Edit Goal</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(goal._id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                    >
                                        <span className="flex items-center gap-2"><Trash className="w-4 h-4" /> Delete Goal</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-5 rounded-2xl border border-white/10 bg-background/40 p-4">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-3xl font-display font-bold text-foreground">
                                {formatCurrency(goal.currentAmount)}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                                of {formatCurrency(goal.targetAmount)}
                            </span>
                        </div>
                        <span className={cn(
                            "text-sm font-medium",
                            isCompleted ? "text-emerald-500" : "text-primary"
                        )}>
                            {progress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/10">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isCompleted ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto border-t border-white/10 pt-4">
                    <Button
                        className="h-9 w-full gap-2"
                        onClick={() => setIsContributeOpen(true)}
                        disabled={isCompleted}
                    >
                        <Plus className="w-4 h-4" /> Contribute
                    </Button>
                </div>
            </GlassCard>

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
                            className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm"
                        >
                            <option value="">Select a wallet</option>
                            {wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name} ({formatCurrency(wallet.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
