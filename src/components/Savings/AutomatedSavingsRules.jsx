import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import savingsRuleService from '../../services/savingsRuleService';

const AutomatedSavingsRules = ({ goalId, onRuleChange }) => {
    const { user } = useSelector(state => state.auth);
    const [rules, setRules] = useState({
        saveBudgetUnderflow: false,
        savePercentage: 0,
        roundUpTransactions: false,
        savingsPriority: 'medium',
        triggerType: 'scheduled',
        name: 'Automated Savings Rule',
        scheduleFrequency: 'monthly',
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (goalId && user) {
            fetchRules();
        }
    }, [goalId, user]);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const existingRules = await savingsRuleService.getUserRules();
            const goalRules = existingRules.find(rule => String(rule.goalId) === String(goalId)) || rules;
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

            const ruleData = {
                ...rules,
                goalId,
                triggerType: rules.roundUpTransactions ? 'roundUp' :
                    rules.saveBudgetUnderflow ? 'budgetUnderflow' :
                        rules.savePercentage > 0 ? 'income' : 'scheduled',
                name: rules.name || `Savings Rule for Goal ${goalId}`,
                scheduleFrequency: rules.triggerType === 'scheduled' ? 'monthly' : 'none'
            };

            if (rules._id) {
                await savingsRuleService.updateRule(rules._id, ruleData);
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
        <GlassCard className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Automated Savings Rules</h3>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-right-4">
                        <CheckCircle2 className="w-4 h-4" />
                        Saved successfully
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Budget Underflow */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <h4 className="font-medium text-foreground">Save Budget Surplus</h4>
                        <p className="text-sm text-muted-foreground">Automatically save remaining budget at end of month</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={rules.saveBudgetUnderflow}
                            onChange={(e) => setRules({ ...rules, saveBudgetUnderflow: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Income Percentage */}
                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between">
                        <div>
                            <h4 className="font-medium text-foreground">Income Percentage</h4>
                            <p className="text-sm text-muted-foreground">Save a percentage of every deposit</p>
                        </div>
                        <span className="font-bold text-primary">{rules.savePercentage}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={rules.savePercentage}
                        onChange={(e) => setRules({ ...rules, savePercentage: Number(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                {/* Round Up */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <h4 className="font-medium text-foreground">Round Up Transactions</h4>
                        <p className="text-sm text-muted-foreground">Round up purchases to the nearest dollar</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={rules.roundUpTransactions}
                            onChange={(e) => setRules({ ...rules, roundUpTransactions: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Savings Priority</label>
                    <select
                        value={rules.savingsPriority}
                        onChange={(e) => setRules({ ...rules, savingsPriority: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm text-foreground"
                    >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                    </select>
                </div>

                <Button
                    className="w-full gap-2"
                    onClick={handleSave}
                    disabled={loading}
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Rules'}
                </Button>
            </div>
        </GlassCard>
    );
};

export default AutomatedSavingsRules;
