import { logError } from '../../utils/logger';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, AlertCircle, CheckCircle2, Repeat, Target, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import savingsRuleService from '../../services/savingsRuleService';
import walletService from '../../services/walletService';

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
        scheduleAmount: 0,
        sourceWalletId: '',
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        if (goalId && user) {
            fetchRules();
            fetchWallets();
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
            logError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const userWallets = await walletService.getAllWallets();
            setWallets(userWallets || []);
        } catch (_) {
            logError('Failed to load wallets');
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
                scheduleFrequency: rules.triggerType === 'scheduled' ? rules.scheduleFrequency : 'none'
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
            logError('Error saving rule:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteRules = async () => {
        try {
            setLoading(true);
            setError(null);
            await savingsRuleService.executeAllRules();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (_) {
            setError('Failed to execute rules');
            logError('Error executing rules');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="space-y-6"
            style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
                padding: '24px',
            }}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Automated Savings Rules</h3>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-right-4">
                        <CheckCircle2 className="w-4 h-4" />
                        {loading ? 'Executing...' : 'Saved successfully'}
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
                {/* Budget Surplus */}
                <div
                    className="flex items-center justify-between p-4"
                    style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                    }}
                >
                    <div>
                        <h4 className="font-medium text-foreground">Save Budget Surplus</h4>
                        <p className="text-sm text-muted-foreground">Automatically save remaining budget at end of month</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRules({ ...rules, saveBudgetUnderflow: !rules.saveBudgetUnderflow })}
                        aria-pressed={rules.saveBudgetUnderflow}
                        aria-label={rules.saveBudgetUnderflow ? 'Disable save budget surplus' : 'Enable save budget surplus'}
                        style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '9999px',
                            border: '1px solid var(--color-border)',
                            background: rules.saveBudgetUnderflow ? 'rgba(255, 209, 102, 0.35)' : 'var(--color-surface-1)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 150ms ease',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: '2px',
                                left: rules.saveBudgetUnderflow ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '9999px',
                                background: rules.saveBudgetUnderflow ? 'var(--color-gold)' : 'var(--color-surface-3)',
                                border: '1px solid var(--color-border)',
                                transition: 'left 150ms ease',
                            }}
                        />
                    </button>
                </div>

                {/* Income Percentage */}
                <div
                    className="space-y-3 p-4"
                    style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                    }}
                >
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
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{ background: 'var(--color-border)' }}
                    />
                </div>

                {/* Round Up */}
                <div
                    className="flex items-center justify-between p-4"
                    style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                    }}
                >
                    <div>
                        <h4 className="font-medium text-foreground">Round Up Transactions</h4>
                        <p className="text-sm text-muted-foreground">Round up purchases to the nearest dollar</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRules({ ...rules, roundUpTransactions: !rules.roundUpTransactions })}
                        aria-pressed={rules.roundUpTransactions}
                        aria-label={rules.roundUpTransactions ? 'Disable round up transactions' : 'Enable round up transactions'}
                        style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '9999px',
                            border: '1px solid var(--color-border)',
                            background: rules.roundUpTransactions ? 'rgba(255, 209, 102, 0.35)' : 'var(--color-surface-1)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 150ms ease',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: '2px',
                                left: rules.roundUpTransactions ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '9999px',
                                background: rules.roundUpTransactions ? 'var(--color-gold)' : 'var(--color-surface-3)',
                                border: '1px solid var(--color-border)',
                                transition: 'left 150ms ease',
                            }}
                        />
                    </button>
                </div>

                {/* Scheduled Transfers */}
                <div
                    className="space-y-3 p-4"
                    style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                    }}
                >
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary" />
                        Scheduled Transfers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Source Wallet</label>
                            <select
                                value={rules.sourceWalletId}
                                onChange={(e) => setRules({ ...rules, sourceWalletId: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    padding: '0 12px',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface-1)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-body)',
                                }}
                            >
                                <option value="">Select a wallet</option>
                                {wallets.map(wallet => (
                                    <option key={wallet._id} value={wallet._id}>
                                        {wallet.name} (${wallet.balance.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                            <input
                                type="number"
                                placeholder="Enter amount"
                                value={rules.scheduleAmount || ''}
                                onChange={(e) => setRules({ ...rules, scheduleAmount: Number(e.target.value) })}
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    padding: '0 12px',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface-1)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-body)',
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                            <select
                                value={rules.scheduleFrequency}
                                onChange={(e) => setRules({ ...rules, scheduleFrequency: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    padding: '0 12px',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface-1)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-body)',
                                }}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Savings Priority</label>
                    <select
                        value={rules.savingsPriority}
                        onChange={(e) => setRules({ ...rules, savingsPriority: e.target.value })}
                        style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            fontSize: '14px',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <Button
                        className="flex-1 gap-2"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Rules'}
                    </Button>
                    <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={handleExecuteRules}
                        disabled={loading}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Execute Rules
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AutomatedSavingsRules;
