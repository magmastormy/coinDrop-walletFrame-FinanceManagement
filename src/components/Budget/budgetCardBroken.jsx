import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Edit2, Trash2, TrendingUp, Calendar, PiggyBank, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import savingsGoalService from '../../services/savingsGoalService';
import { Button } from '../ui/Button';
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
        level={1}
        hover={true}
        className={cn("budget-card", isSelected && "card-selected")}
        onClick={() => onSelect?.(budget)}
        style={{ minHeight: '240px' }}
      >
        <div className="flex h-full flex-col gap-3">
          {/* Header */}
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 className="card-title">{budget.name}</h3>
              <span className="text-xs uppercase tracking-wide" style={{ 
                fontSize: 'var(--text-xs)', 
                color: 'var(--color-text-secondary)',
                letterSpacing: 'var(--tracking-wide)'
              }}>{budget.type}</span>
            </div>
            {walletName && (
              <div className="cluster" style={{
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-primary-200)',
                background: 'var(--color-primary-50)',
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-primary-600)'
              }}>
                <Wallet size={14} strokeWidth={1.5} />
                {walletName}
              </div>
            )}
          </div>

          <div className="card-metric">
            <div className="card-metric-label">Planned Limit</div>
            <div className="card-metric-value">{formatCurrency(budget.amount)}</div>
            <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
              Remaining: <span className="text-primary" style={{ fontWeight: 'var(--weight-semibold)' }}>{formatCurrency(savingsAmount)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="stack" style={{ gap: 'var(--space-1)' }}>
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <span className="text-secondary">Progress</span>
              <span className="text-primary" style={{ fontWeight: 'var(--weight-medium)' }}>{calculateProgress().toFixed(1)}%</span>
            </div>
            <div style={{ 
              height: '8px', 
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-2)',
              overflow: 'hidden'
            }}>
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: 'var(--radius-pill)',
                  background: getStatusColor()
                }}
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="cluster" style={{ 
              justifyContent: 'space-between', 
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)'
            }}>
              <span>Spent: {formatCurrency(budget.spent || 0)}</span>
              <span>Limit: {formatCurrency(budget.amount)}</span>
            </div>
          </div>

          {/* Details */}
          <div className="stack" style={{ 
              gap: 'var(--space-1)', 
              paddingTop: 'var(--space-2)', 
              borderTop: '1px solid var(--color-border)' 
            }}>
            <div className="cluster" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <TrendingUp size={14} strokeWidth={1.5} />
              <span>Category: {budget.category?.name || 'Uncategorized'}</span>
            </div>
            <div className="cluster" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <Calendar size={14} strokeWidth={1.5} />
              <span>
                {budget.startDate ? formatDate(budget.startDate) : 'N/A'} - {budget.endDate ? formatDate(budget.endDate) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="cluster" style={{ 
              marginTop: 'auto', 
              paddingTop: 'var(--space-2)', 
              borderTop: '1px solid var(--color-border)' 
            }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
            >
              <Edit2 size={14} strokeWidth={1.5} /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(budget._id); }}
            >
              <Trash2 size={14} strokeWidth={1.5} /> Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowSaveDialog(true); }}
              disabled={savingsAmount <= 0}
            >
              Save Surplus
            </Button>

        {showSaveDialog && (
        <Modal isOpen={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
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
        )}
          </div>
        </div>
      </Card>
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
