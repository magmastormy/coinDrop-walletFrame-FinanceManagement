import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Edit2, Trash2, TrendingUp, Calendar, PiggyBank, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import savingsGoalService from '../../services/savingsGoalService';
import Button from '../ui/Button';
import Card from '../ui/Card';
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
    } catch (_) {
      // Silently handle error - savings goals are optional
      // Error intentionally not logged to avoid noise
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
    if (progress >= 90) return 'var(--color-error)';
    if (progress >= 70) return 'var(--color-warning)';
    return 'var(--color-success)';
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
      <Card
        variant="default"
        elevation={1}
        hover={true}
        className={cn("p-4 h-full", isSelected && "ring-2 ring-primary")}
        onClick={() => onSelect?.(budget)}
      >
        <div className="flex h-full flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="text-lg font-semibold text-primary">{budget.name}</h3>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {budget.type}
                </span>
              </div>
              {walletName && (
                <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 text-xs font-medium text-primary whitespace-nowrap">
                  <Wallet className="w-3 h-3" strokeWidth={1.5} />
                  {walletName}
                </div>
              )}
            </div>

          {/* Financial Metrics */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Planned Limit</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(budget.amount)}
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: <span className="font-semibold text-success">{formatCurrency(savingsAmount)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-primary">{calculateProgress().toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: getStatusColor() }}
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
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp size={14} strokeWidth={1.5} />
              <span>Category: {budget.category?.name || 'Uncategorized'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} strokeWidth={1.5} />
              <span>
                {budget.startDate ? formatDate(budget.startDate) : 'N/A'} - {budget.endDate ? formatDate(budget.endDate) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
            >
              <Edit2 size={14} strokeWidth={1.5} className="mr-1" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onDelete(budget._id); }}
            >
              <Trash2 size={14} strokeWidth={1.5} className="mr-1" /> Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); setShowSaveDialog(true); }}
              disabled={savingsAmount <= 0}
            >
              <PiggyBank size={14} strokeWidth={1.5} className="mr-1" />
              Save ${savingsAmount.toFixed(0)}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Save Budget Surplus"
      >
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          <div style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-success, 0.2)',
            background: 'var(--color-success, 0.1)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)'
          }}>
            <PiggyBank size={16} style={{ color: 'var(--color-success)', marginTop: 'var(--space-1)' }} />
            <div>
              <h4 style={{ 
                fontWeight: 'var(--weight-medium)', 
                color: 'var(--color-success)' 
              }}>Surplus Available</h4>
              <p style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--color-success, 0.8)' 
              }}>
                You have <span style={{ fontWeight: 'var(--weight-bold)' }}>${savingsAmount.toFixed(2)}</span> remaining in this budget.
                Would you like to move it to a savings goal?
              </p>
            </div>
          </div>

          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            <label style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 'var(--weight-medium)', 
              color: 'var(--color-text-primary)' 
            }}>Select Savings Goal</label>
            <select
              value={selectedGoal || ''}
              onChange={(e) => {
                setSelectedGoal(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: 'var(--space-3)',
                paddingRight: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-0)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-sm)'
              }}
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
            <div className="cluster" style={{
              padding: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-error)',
              background: 'var(--color-error, 0.1)',
              border: '1px solid var(--color-error, 0.2)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="cluster" style={{ 
              justifyContent: 'flex-end', 
              gap: 'var(--space-2)', 
              paddingTop: 'var(--space-2)' 
            }}>
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
