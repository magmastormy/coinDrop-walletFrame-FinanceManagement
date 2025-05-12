import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChartLine, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import savingsGoalService from '../../services/savingsGoalService';
import { toast } from 'react-toastify';

const BudgetCard = ({ budget, onEdit, onDelete, onSelect, isSelected }) => {
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
      toast.error('Failed to fetch savings goals');
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
      
      const walletId = budget.walletId;
      
      if (!walletId) {
        throw new Error('This budget does not have an associated wallet');
      }
      
      console.log('Contributing to goal:', selectedGoal, {
        sourceType: 'wallet',
        sourceId: walletId,
        amount: savingsAmount
      });
      
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

  const handleGoalSelect = (event) => {
    setSelectedGoal(event.target.value);
    setError(''); 
  };

  const handleSaveClick = () => {
    handleSaveToGoal();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card
        onClick={() => onSelect?.(budget)}
        sx={{
          mb: 2,
          cursor: onSelect ? 'pointer' : 'default',
          border: isSelected ? '2px solid #1976d2' : undefined
        }}
      >
        <CardHeader
          title={budget.name}
          subheader={budget.type.charAt(0).toUpperCase() + budget.type.slice(1)}
        />
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2">{calculateProgress().toFixed(1)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            sx={{ height: 10, borderRadius: 5, backgroundColor: '#eee', '& .MuiLinearProgress-bar': { backgroundColor: getStatusColor() } }}
          />
          <Box display="flex" justifyContent="space-between" mt={1} mb={2}>
            <Typography variant="caption">Spent: {formatCurrency(budget.spent || 0)}</Typography>
            <Typography variant="caption">of {formatCurrency(budget.amount)}</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={1} mb={2}>
            <Typography variant="body2"><FontAwesomeIcon icon={faChartLine} /> Category: {budget.category.name || 'Uncategorized'}</Typography>
            <Typography variant="body2"><FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(budget.startDate)} - {formatDate(budget.endDate)}</Typography>
          </Box>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={e => { e.stopPropagation(); onEdit(budget); }} startIcon={<FontAwesomeIcon icon={faEdit} />}>Edit</Button>
          <Button size="small" color="error" onClick={e => { e.stopPropagation(); onDelete(budget._id); }} startIcon={<FontAwesomeIcon icon={faTrash} />}>Delete</Button>
          <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); setShowSaveDialog(true); }} disabled={calculateSavings() <= 0}>Save Surplus (${calculateSavings().toFixed(2)})</Button>
        </CardActions>
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
      </Card>
    </motion.div>
  );
};

BudgetCard.propTypes = {
  budget: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    spent: PropTypes.number,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    walletId: PropTypes.string,
    category: PropTypes.shape({
      name: PropTypes.string
    }).isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool
};

export default BudgetCard;