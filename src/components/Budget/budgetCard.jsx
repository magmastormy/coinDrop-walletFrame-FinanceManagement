import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Edit2, Trash2, TrendingUp, Calendar, PiggyBank, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import savingsGoalService from '../../services/savingsGoalService';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';
import { cn } from '../../lib/utils';

const BudgetCard = ({ budget, onEdit, onDelete, onSelect, isSelected, wallets }) => {
  const { user } = useSelector(state => state.auth);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSavingsGoals();
    }
  }, [user?.id]);

  const fetchSavingsGoals = async () => {
    try {
      const goals = await savingsGoalService.getSavingsGoals(user.id);
      setSavingsGoals(goals);
    } catch (error) {
      console.error('Failed to fetch savings goals:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = () => {
    const spent = budget.spent || 0;
    const progress = (spent / budget.amount) * 100;
    return Math.min(progress, 100);
  };

  const getStatusColor = () => {
    const progress = calculateProgress();
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const calculateSavings = () => {
    const spent = budget.spent || 0;
    return Math.max(0, budget.amount - spent);
  };

  const handleSaveToGoal = async () => {
    if (!selectedGoal) {
      setError('Please select a savings goal');
      return;
    }

    const savingsAmount = calculateSavings();
    if (savingsAmount <= 0) {
      setError('No surplus available to save');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      const walletId = budget.walletId;

      if (!walletId) {
        throw new Error('This budget does not have an associated wallet');
      }

      await savingsGoalService.contributeToGoal(selectedGoal, {
        sourceType: 'wallet',
        sourceId: walletId,
        amount: parseFloat(savingsAmount)
      });

      toast.success(`Successfully saved $${savingsAmount.toFixed(2)} to your goal!`);
      setSelectedGoal(null);
      setShowSaveDialog(false);

      if (onEdit) {
        onEdit(budget);
      }
    } catch (error) {
      console.error('Failed to save to goal:', error);

      if (error.response?.data?.details === 'Insufficient balance in source wallet') {
        toast.error('Insufficient funds in wallet to complete this transfer');
      } else {
        toast.error('Failed to contribute to goal');
      }

      setError(error.message || 'Failed to contribute to goal');
    } finally {
      setIsProcessing(false);
    }
  };

  // Find wallet name if wallets prop is provided and budget.walletId exists
  let walletName = '';
  if (wallets && budget.walletId) {
    const wallet = wallets.find(w => w._id === budget.walletId);
    walletName = wallet ? wallet.name : '';
  }

  const savingsAmount = calculateSavings();

  return (
    <>
      <GlassCard
        className={cn(
          "relative h-full min-h-[292px] overflow-hidden border border-white/15 bg-gradient-to-b from-white/30 via-white/10 to-transparent p-5 transition-all duration-300 hover:translate-y-[-4px] dark:from-white/10 dark:via-white/5",
          isSelected && "ring-2 ring-primary/60"
        )}
        onClick={() => onSelect?.(budget)}
      >
        <div className="flex h-full flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{budget.name}</h3>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{budget.type}</span>
            </div>
            {walletName && (
              <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Wallet className="w-3 h-3" />
                {walletName}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Planned Limit</p>
            <p className="mt-2 text-3xl font-display font-bold text-foreground">{formatCurrency(budget.amount)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Remaining: <span className="font-semibold text-emerald-500">{formatCurrency(savingsAmount)}</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{calculateProgress().toFixed(1)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary/80">
              <motion.div
                className={cn("h-full rounded-full", getStatusColor())}
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Spent: {formatCurrency(budget.spent || 0)}</span>
              <span>Limit: {formatCurrency(budget.amount)}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Category: {budget.category?.name || 'Uncategorized'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {budget.startDate ? formatDate(budget.startDate) : 'N/A'} - {budget.endDate ? formatDate(budget.endDate) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onDelete(budget._id); }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-9 text-xs"
              onClick={(e) => { e.stopPropagation(); setShowSaveDialog(true); }}
              disabled={savingsAmount <= 0}
            >
              <PiggyBank className="w-4 h-4 mr-1.5" />
              Save ${savingsAmount.toFixed(0)}
            </Button>
          </div>
        </div>
      </GlassCard>

      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Save Budget Surplus"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
            <PiggyBank className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-500">Surplus Available</h4>
              <p className="text-sm text-emerald-500/80">
                You have <span className="font-bold">${savingsAmount.toFixed(2)}</span> remaining in this budget.
                Would you like to move it to a savings goal?
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Savings Goal</label>
            <select
              value={selectedGoal || ''}
              onChange={(e) => {
                setSelectedGoal(e.target.value);
                setError('');
              }}
              className="w-full h-10 pl-3 pr-8 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
            >
              <option value="" disabled>Choose a goal...</option>
              {savingsGoals.map(goal => (
                <option key={goal._id} value={goal._id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveToGoal}
              disabled={isProcessing || !selectedGoal || savingsAmount <= 0}
            >
              {isProcessing ? 'Saving...' : 'Confirm Transfer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

BudgetCard.propTypes = {
  budget: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    spent: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    walletId: PropTypes.string,
    category: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool,
  wallets: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }))
};

export default BudgetCard;
