import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, IconButton, Box, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, FormControl, InputLabel, Select, ListSubheader, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSelector } from 'react-redux';
import AutomatedSavingsRules from '../Savings/AutomatedSavingsRules';
import walletService from '../../services/walletService';
import savingsAccountService from '../../services/savingsAccountService';
import savingsGoalService from '../../services/savingsGoalService';
import './styles/savingsGoalsCardStyles.css';

const SavingsGoalCard = ({ goal, onEdit, onDelete }) => {
    const { isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);

    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const [showRules, setShowRules] = useState(false);
    const [showContributeDialog, setShowContributeDialog] = useState(false);
    const [contributionAmount, setContributionAmount] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [sources, setSources] = useState({ wallets: [], savingsAccounts: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSources();
    }, [user?.id]);

    const fetchSources = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [wallets, savingsAccounts] = await Promise.all([
                walletService.getAllWallets(user.id),
                savingsAccountService.getUserSavingsAccounts(user.id)
            ]);
            setSources({
                wallets: Array.isArray(wallets) ? wallets : [],
                savingsAccounts: Array.isArray(savingsAccounts) ? savingsAccounts : []
            });
        } catch (error) {
            console.error('Error fetching sources:', error);
            setError('Failed to load funding sources');
            setSources({ wallets: [], savingsAccounts: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleContribute = async () => {
        try {
            if (!selectedSource || !contributionAmount) return;

            const [sourceType, sourceId] = selectedSource.split('-');
            const amount = parseFloat(contributionAmount);

            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid contribution amount');
            }

            await savingsGoalService.contributeToGoal(goal.id, {
                sourceType,
                sourceId,
                amount
            });

            setShowContributeDialog(false);
            setContributionAmount('');
            setSelectedSource('');
            
            // Refresh goal data
            if (onEdit) {
                onEdit(goal);
            }
        } catch (error) {
            console.error('Error contributing to goal:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <motion.div 
            className={`savings-goal-card ${isDarkMode ? 'dark' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="goal-card">
                <CardContent>
                    <Box className="card-header">
                        <Box className="title-section">
                            <FontAwesomeIcon icon={faBullseye} className="goal-icon" />
                            <div className="title-content">
                                <Typography variant="h6" className="goal-title">
                                    {goal.name}
                                </Typography>
                                <Typography variant="body2" className="goal-deadline">
                                    Target Date: {formatDate(goal.deadline)}
                                </Typography>
                            </div>
                        </Box>
                        <Box className="action-buttons">
                            <IconButton 
                                onClick={() => onEdit(goal)}
                                className="edit-button"
                                size="small"
                                aria-label="Edit goal"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </IconButton>
                            <IconButton 
                                onClick={() => onDelete(goal._id)}
                                className="delete-button"
                                size="small"
                                aria-label="Delete goal"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box className="progress-section">
                        <Typography variant="body2" className="progress-text">
                            Progress: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage}
                            className="progress-bar"
                        />
                    </Box>

                    {goal.description && (
                        <Typography 
                            variant="body2" 
                            className="goal-description"
                            sx={{ mt: 2 }}
                        >
                            {goal.description}
                        </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setShowContributeDialog(true)}
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            Contribute to Goal
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => setShowRules(!showRules)}
                            fullWidth
                        >
                            {showRules ? 'Hide Rules' : 'Automation Rules'}
                        </Button>
                    </Box>

                    {showRules && (
                        <Box sx={{ mt: 2 }}>
                            <AutomatedSavingsRules 
                                goalId={goal.id}
                                onRuleChange={(rules) => {
                                    console.log('Rules updated:', rules);
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showContributeDialog} onClose={() => setShowContributeDialog(false)}>
                <DialogTitle>Contribute to {goal.name}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Choose a source and amount to contribute to your goal.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount"
                        type="number"
                        fullWidth
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Source</InputLabel>
                        <Select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            label="Source"
                        >
                            {isLoading ? (
                                <MenuItem disabled>Loading sources...</MenuItem>
                            ) : error ? (
                                <MenuItem disabled>Error loading sources</MenuItem>
                            ) : (
                                <>
                                    <ListSubheader>Wallets</ListSubheader>
                                    {sources.wallets.map(wallet => (
                                        <MenuItem key={`wallet-${wallet.id}`} value={`wallet-${wallet.id}`}>
                                            {wallet.name} ({formatCurrency(wallet.balance)})
                                        </MenuItem>
                                    ))}
                                    <ListSubheader>Savings Accounts</ListSubheader>
                                    {sources.savingsAccounts.map(account => (
                                        <MenuItem key={`savings-${account.id}`} value={`savings-${account.id}`}>
                                            {account.name} ({formatCurrency(account.balance)})
                                        </MenuItem>
                                    ))}
                                </>
                            )}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowContributeDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleContribute}
                        disabled={!selectedSource || !contributionAmount || isLoading}
                        variant="contained"
                    >
                        Contribute
                    </Button>
                </DialogActions>
            </Dialog>
        </motion.div>
    );
};

export default SavingsGoalCard;