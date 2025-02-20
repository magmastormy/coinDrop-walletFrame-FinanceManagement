import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    Slider,
    FormControl,
    FormControlLabel,
    Select,
    MenuItem,
    Button,
    Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import savingsRuleService from '../../services/savingsRuleService';

const AutomatedSavingsRules = ({ goalId, onRuleChange }) => {
    const { user } = useSelector(state => state.auth);
    const [rules, setRules] = useState({
        saveBudgetUnderflow: false,
        savePercentage: 0,
        roundUpTransactions: false,
        savingsPriority: 'medium'
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

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);
            await savingsRuleService.updateRule(goalId, {
                ...rules,
                userId: user.id,
                goalId
            });
            setSuccess(true);
            if (onRuleChange) {
                onRuleChange(rules);
            }
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save rules');
            console.error(err);
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
                    onClick={handleSave}
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
