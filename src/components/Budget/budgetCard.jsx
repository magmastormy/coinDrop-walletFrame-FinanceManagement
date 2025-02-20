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
import './styles/budgetCardStyles.css';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const { user } = useSelector(state => state.auth);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);

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
    if (!selectedGoal) return;
    
    try {
      const savings = calculateSavings();
      
      // First check if there are any automated rules for this goal
      const rules = await savingsRuleService.getUserRules(user.id);
      const goalRules = rules.filter(rule => rule.goalId === selectedGoal.id);
      
      // If there's a rule with saveBudgetUnderflow enabled, use that percentage
      const saveBudgetRule = goalRules.find(rule => rule.saveBudgetUnderflow);
      const savingsAmount = saveBudgetRule 
          ? (savings * saveBudgetRule.savePercentage / 100)
          : savings;

      // Contribute to the goal
      await savingsGoalService.contributeToGoal(selectedGoal.id, {
        amount: savingsAmount,
        sourceType: 'budget',
        sourceId: budget.id
      });

      setShowSaveDialog(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to save to goal:', error);
    }
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
              value={selectedGoal?.id || ''}
              onChange={(e) => {
                const goal = savingsGoals.find(g => g.id === e.target.value);
                setSelectedGoal(goal);
              }}
            >
              {savingsGoals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.name} (${goal.currentAmount} / ${goal.targetAmount})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveToGoal} 
            disabled={!selectedGoal}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default BudgetCard;