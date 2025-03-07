import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChartLine, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import savingsGoalService from '../../services/savingsGoalService';
import savingsRuleService from '../../services/savingsRuleService';
import budgetService from '../../services/budgetService';
import './styles/budgetCardStyles.css';
import { toast } from 'react-toastify';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const { user } = useSelector(state => state.auth);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSavingsGoals();
  }, [user.id]);

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
    if (progress >= 90) return 'var(--error)';
    if (progress >= 70) return 'var(--warning)';
    return 'var(--accent-2)';
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
      
      // Get walletId from budget
      let walletId = budget.walletId || budget.wallet?._id;
      
      // If walletId is still not available, try to fetch it
      if (!walletId) {
        try {
          const fullBudgetDetails = await budgetService.getBudgetById(budget._id);
          walletId = fullBudgetDetails?.walletId || fullBudgetDetails?.wallet?._id;
          
          if (!walletId) {
            throw new Error('Could not find wallet associated with this budget');
          }
        } catch (err) {
          throw new Error('Could not retrieve wallet information for this budget');
        }
      }
      
      console.log('Contributing to goal:', selectedGoal, {
        sourceType: 'wallet',
        sourceId: walletId,
        amount: savingsAmount
      });
      
      // Use the same format as in savingsGoalCard.jsx
      await savingsGoalService.contributeToGoal(selectedGoal, {
        sourceType: 'wallet',
        sourceId: walletId,
        amount: parseFloat(savingsAmount)
      });
      
      toast.success(`Successfully saved $${savingsAmount.toFixed(2)} to your goal!`);
      setSelectedGoal(null);
      setShowSaveDialog(false);
      
      // If there's an onEdit callback, call it to refresh the budget
      if (onEdit) {
        onEdit(budget);
      }
    } catch (error) {
      console.error('Failed to save to goal:', error);
      setError(error.message || 'Failed to contribute to goal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoalSelect = (event) => {
    setSelectedGoal(event.target.value);
    setError(''); // Clear any previous errors
  };

  const handleSaveClick = () => {
    handleSaveToGoal();
  };

  return (
    <motion.div 
      className="budget-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="budget-header">
        <h3>{budget.name}</h3>
        <div className="budget-type-badge">
          {budget.type}
        </div>
      </div>

      <div className="budget-progress">
        <div className="progress-info">
          <span>Progress</span>
          <span>{calculateProgress().toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${calculateProgress()}%`,
              backgroundColor: getStatusColor()
            }}
            role="progressbar"
            aria-valuenow={calculateProgress()}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <div className="budget-amounts">
          <span>Spent: {formatCurrency(budget.spent || 0)}</span>
          <span>of {formatCurrency(budget.amount)}</span>
        </div>
      </div>

      <div className="budget-details">
        <div className="detail-item">
          <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
          <span>Category: {budget.categoryId?.name || 'Uncategorized'}</span>
        </div>
        <div className="detail-item">
          <FontAwesomeIcon icon={faCalendarAlt} aria-hidden="true" />
          <span>
            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </span>
        </div>
      </div>

      <div className="budget-status" style={{ color: getStatusColor() }}>
        {budget.status}
      </div>

      <div className="budget-actions">
        <button 
          onClick={() => onEdit(budget)}
          className="edit-btn"
          aria-label="Edit budget"
        >
          <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
          Edit
        </button>
        <button 
          onClick={() => onDelete(budget._id)}
          className="delete-btn"
          aria-label="Delete budget"
        >
          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
          Delete
        </button>
      </div>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => setShowSaveDialog(true)}
          disabled={calculateSavings() <= 0}
        >
          Save Surplus to Goal (${calculateSavings().toFixed(2)})
        </Button>
      </Box>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Budget Surplus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have ${calculateSavings().toFixed(2)} available to save. Choose a goal:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Savings Goal</InputLabel>
            <Select
              value={selectedGoal || ''}
              onChange={handleGoalSelect}
              fullWidth
            >
              <MenuItem value="" disabled>
                Select a savings goal
              </MenuItem>
              {savingsGoals.map(goal => (
                <MenuItem 
                  key={goal._id} 
                  value={goal._id}
                >
                  {goal.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveClick} 
            color="primary"
            disabled={isProcessing || !selectedGoal || calculateSavings() <= 0}
          >
            {isProcessing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default BudgetCard;