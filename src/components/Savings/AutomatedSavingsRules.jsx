import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useSelector } from 'react-redux';
import savingsRuleService from '../../services/savingsRuleService';

const AutomatedSavingsRules = ({ goalId, onRuleChange }) => {
    const { user } = useSelector(state => state.auth);
    const [rules, setRules] = useState({
        saveBudgetUnderflow: false,
        savePercentage: 0,
        roundUpTransactions: false,
        savingsPriority: 'medium',
        triggerType: 'scheduled', // Required field with default value
        name: 'Automated Savings Rule', // Required field
        scheduleFrequency: 'monthly', // Required for scheduled trigger type
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchRules();
    }, [goalId]);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const existingRules = await savingsRuleService.getUserRules(user.id);
            const goalRules = existingRules.find(rule => rule.goalId === goalId) || rules;
            setRules(goalRules);
        } catch (err) {
            setError('Failed to load savings rules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            
            // Prepare the rule data with all required fields
            const ruleData = {
                ...formData,
                userId: user.id,
                goalId,
                // Set appropriate triggerType based on selected options
                triggerType: formData.roundUpTransactions ? 'roundUp' : 
                             formData.saveBudgetUnderflow ? 'budgetUnderflow' : 
                             formData.savePercentage > 0 ? 'income' : 'scheduled',
                // Ensure name is set
                name: formData.name || `Savings Rule for Goal ${goalId}`,
                // Set appropriate schedule frequency if it's a scheduled rule
                scheduleFrequency: formData.triggerType === 'scheduled' ? 'monthly' : 'none'
            };
            
            console.log('Saving rule with data:', ruleData);
            
            if (formData._id) {
                await savingsRuleService.updateRule(formData._id, ruleData);
            } else {
                await savingsRuleService.createRule(ruleData);
            }
            
            setSuccess(true);
            if (onRuleChange) {
                onRuleChange(ruleData);
            }
            setTimeout(() => setSuccess(false), 3000);
            fetchRules();
        } catch (err) {
            // Extract validation error details if available
            if (err.response?.data?.details) {
                const errorDetails = err.response.data.details.map(detail => detail.message).join(', ');
                setError(`Validation error: ${errorDetails}`);
            } else {
                setError('Failed to save rules: ' + (err.response?.data?.error || err.message || 'Unknown error'));
            }
            console.error('Error saving rule:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Automated Savings Rules
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Rules saved successfully!
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={rules.saveBudgetUnderflow}
                                onChange={(e) => setRules({ ...rules, saveBudgetUnderflow: e.target.checked })}
                            />
                        }
                        label="Save budget surplus automatically"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                        Save percentage of income: {rules.savePercentage}%
                    </Typography>
                    <Slider
                        value={rules.savePercentage}
                        onChange={(_, value) => setRules({ ...rules, savePercentage: value })}
                        min={0}
                        max={50}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={rules.roundUpTransactions}
                                onChange={(e) => setRules({ ...rules, roundUpTransactions: e.target.checked })}
                            />
                        }
                        label="Round up transactions to nearest dollar"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                        <Typography gutterBottom>
                            Savings Priority
                        </Typography>
                        <Select
                            value={rules.savingsPriority}
                            onChange={(e) => setRules({ ...rules, savingsPriority: e.target.value })}
                        >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSave(rules)}
                    disabled={loading}
                    fullWidth
                >
                    {loading ? 'Saving...' : 'Save Rules'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default AutomatedSavingsRules;
