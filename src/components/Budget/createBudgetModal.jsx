import { useLogger } from '../../hooks/useLogger.jsx';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import budgetService from '../../services/budgetService';
import ValidationUtils from '../../utils/validationUtils';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import Button from '../ui/Button';
import { Select } from '../ui/Select';
import { Loader2, Calendar, Wallet, Tag, DollarSign, PieChart, Brain, Repeat, Bell } from 'lucide-react';
import dayjs from 'dayjs';

const CreateBudgetModal = ({ isOpen, onClose, onCreateBudget, categories, wallets = [], userId, budgetData }) => {
    // Ensure wallets is an array
    const walletOptions = Array.isArray(wallets) ? wallets : [];

    const [budgetFormData, setBudgetFormData] = useState({
        name: '',
        amount: '',
        categoryId: '',
        walletId: '',
        type: 'expense',
        period: 'monthly',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: '',
        metadata: {
            icon: 'budget',
            color: '#007bff'
        },
        automation: {
            autoCategorize: {
                enabled: true,
                threshold: 0.7
            },
            recurring: {
                enabled: true,
                autoRenew: true
            },
            alerts: {
                enabled: true,
                thresholds: {
                    high: 90,
                    medium: 75
                }
            }
        }
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Update budgetFormData when budgetData changes
    useEffect(() => {
        if (budgetData) {
            setBudgetFormData({
                name: budgetData.name,
                amount: budgetData.amount,
                type: budgetData.type,
                categoryId: budgetData.categoryId,
                walletId: budgetData.walletId,
                startDate: budgetData.startDate ? dayjs(budgetData.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                endDate: budgetData.endDate ? dayjs(budgetData.endDate).format('YYYY-MM-DD') : '',
                metadata: {
                    icon: (budgetData.metadata && budgetData.metadata.icon) ? budgetData.metadata.icon : 'budget',
                    color: (budgetData.metadata && budgetData.metadata.color) ? budgetData.metadata.color : '#007bff'
                },
                automation: {
                    autoCategorize: {
                        enabled: budgetData.automation?.autoCategorize?.enabled ?? true,
                        threshold: budgetData.automation?.autoCategorize?.threshold ?? 0.7
                    },
                    recurring: {
                        enabled: budgetData.automation?.recurring?.enabled ?? true,
                        autoRenew: budgetData.automation?.recurring?.autoRenew ?? true
                    },
                    alerts: {
                        enabled: budgetData.automation?.alerts?.enabled ?? true,
                        thresholds: {
                            high: budgetData.automation?.alerts?.thresholds?.high ?? 90,
                            medium: budgetData.automation?.alerts?.thresholds?.medium ?? 75
                        }
                    }
                }
            });
        } else {
            resetForm();
        }
    }, [budgetData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate userId first
        if (!userId || typeof userId !== 'string') {
            setError('User authentication required. Please log in again.');
            setLoading(false);
            return;
        }

        // Validate required fields
        if (!budgetFormData.name || !budgetFormData.amount || !budgetFormData.categoryId || !budgetFormData.walletId || !budgetFormData.type) {
            setError('All fields are required: name, amount, category, wallet, and type');
            setLoading(false);
            return;
        }

        // Validate amount using ValidationUtils
        const amountValidation = ValidationUtils.validateAmount(budgetFormData.amount, false);
        if (!amountValidation.isValid) {
            setError(amountValidation.error);
            setLoading(false);
            return;
        }

        // Validate budget name
        const nameValidation = ValidationUtils.validateRequiredString(budgetFormData.name, 'Budget name', 1, 100);
        if (!nameValidation.isValid) {
            setError(nameValidation.error);
            setLoading(false);
            return;
        }

        const amount = parseFloat(budgetFormData.amount);

        try {
            const budgetPayload = {
                name: budgetFormData.name.trim(),
                amount: amount,
                categoryId: budgetFormData.categoryId,
                walletId: budgetFormData.walletId,
                userId: userId,
                type: budgetFormData.type,
                startDate: budgetFormData.startDate,
                endDate: budgetFormData.endDate || null,
                period: budgetFormData.period || 'monthly',
                automation: budgetFormData.automation
            };

            if (budgetData) {
                await ValidationUtils.withTimeout(
                    ValidationUtils.withRetry(
                        () => budgetService.updateBudget(budgetData._id, budgetPayload),
                        'updateBudget',
                        3,
                        1000
                    ),
                    30000
                );
            } else {
                await ValidationUtils.withTimeout(
                    ValidationUtils.withRetry(
                        () => budgetService.createBudget(budgetPayload),
                        'createBudget',
                        3,
                        1000
                    ),
                    30000
                );
            }

            onCreateBudget();
            resetForm();
            onClose();
        } catch (err) {
            logError('Budget operation failed:', err);
            setError(err.message || 'Failed to save budget. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setBudgetFormData({
            name: '',
            amount: '',
            categoryId: '',
            walletId: '',
            type: 'expense',
            period: 'monthly',
            startDate: dayjs().format('YYYY-MM-DD'),
            endDate: '',
            metadata: {
                icon: 'budget',
                color: '#007bff'
            },
            automation: {
                autoCategorize: {
                    enabled: true,
                    threshold: 0.7
                },
                recurring: {
                    enabled: true,
                    autoRenew: true
                },
                alerts: {
                    enabled: true,
                    thresholds: {
                        high: 90,
                        medium: 75
                    }
                }
            }
        });
        setError(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={budgetData ? 'Edit Budget' : 'Create New Budget'}
            className="max-w-md w-[calc(100vw-2rem)] sm:w-full"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Budget Name"
                    value={budgetFormData.name}
                    onChange={e => setBudgetFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Monthly Groceries"
                    required
                    fullWidth
                />

                <Input
                    label="Amount"
                    type="number"
                    value={budgetFormData.amount}
                    onChange={e => setBudgetFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    icon={DollarSign}
                    required
                    fullWidth
                />

                <Select
                    label="Type"
                    value={budgetFormData.type}
                    onChange={e => setBudgetFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="pl-10"
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="savings">Savings</option>
                </Select>

                <Select
                    label="Category"
                    value={budgetFormData.categoryId}
                    onChange={e => setBudgetFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="pl-10"
                    required
                >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </Select>

                <Select
                    label="Wallet"
                    value={budgetFormData.walletId}
                    onChange={e => setBudgetFormData(prev => ({ ...prev, walletId: e.target.value }))}
                    className="pl-10"
                    required
                >
                    <option value="" disabled>Select Wallet</option>
                    {walletOptions.map(w => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={budgetFormData.startDate}
                        onChange={e => setBudgetFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="pl-10"
                        required
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={budgetFormData.endDate}
                        onChange={e => setBudgetFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="pl-10"
                    />
                </div>

            {/* Automation Settings */}
            <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Automation Settings</h3>
                
                {/* Auto-Categorization */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary" />
                            Auto-Categorization
                        </label>
                <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="autoCategorize" 
                        className="sr-only peer" 
                        checked={budgetFormData.automation.autoCategorize.enabled}
                        onChange={(e) => setBudgetFormData({ 
                            ...budgetFormData, 
                            automation: {
                                ...budgetFormData.automation,
                                autoCategorize: {
                                    ...budgetFormData.automation.autoCategorize,
                                    enabled: e.target.checked
                                }
                            }
                        })}
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                    </div>
                    {budgetFormData.automation.autoCategorize.enabled && (
                        <div className="pl-6 space-y-2">
                            <label className="text-sm text-foreground">Confidence Threshold</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={budgetFormData.automation.autoCategorize.threshold}
                                onChange={(e) => setBudgetFormData({ 
                                    ...budgetFormData, 
                                    automation: {
                                        ...budgetFormData.automation,
                                        autoCategorize: {
                                            ...budgetFormData.automation.autoCategorize,
                                            threshold: parseFloat(e.target.value)
                                        }
                                    }
                                })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low (0.1)</span>
                                <span>{budgetFormData.automation.autoCategorize.threshold.toFixed(1)}</span>
                                <span>High (1.0)</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recurring Budget */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Repeat className="w-4 h-4 text-primary" />
                            Recurring Budget
                        </label>
                <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="recurring" 
                        className="sr-only peer" 
                        checked={budgetFormData.automation.recurring.enabled}
                        onChange={(e) => setBudgetFormData({ 
                            ...budgetFormData, 
                            automation: {
                                ...budgetFormData.automation,
                                recurring: {
                                    ...budgetFormData.automation.recurring,
                                    enabled: e.target.checked
                                }
                            }
                        })}
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                    </div>
                    {budgetFormData.automation.recurring.enabled && (
                        <div className="pl-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-foreground">Auto-Renew</label>
                <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="autoRenew" 
                        className="sr-only peer" 
                        checked={budgetFormData.automation.recurring.autoRenew}
                        onChange={(e) => setBudgetFormData({ 
                            ...budgetFormData, 
                            automation: {
                                ...budgetFormData.automation,
                                recurring: {
                                    ...budgetFormData.automation.recurring,
                                    autoRenew: e.target.checked
                                }
                            }
                        })}
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Budget Alerts */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            Budget Alerts
                        </label>
                <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="budgetAlerts" 
                        className="sr-only peer" 
                        checked={budgetFormData.automation.alerts.enabled}
                        onChange={(e) => setBudgetFormData({ 
                            ...budgetFormData, 
                            automation: {
                                ...budgetFormData.automation,
                                alerts: {
                                    ...budgetFormData.automation.alerts,
                                    enabled: e.target.checked
                                }
                            }
                        })}
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                    </div>
                    {budgetFormData.automation.alerts.enabled && (
                        <div className="pl-6 space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm text-foreground">High Threshold ({budgetFormData.automation.alerts.thresholds.high}%)</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={budgetFormData.automation.alerts.thresholds.high}
                                    onChange={(e) => setBudgetFormData({ 
                                        ...budgetFormData, 
                                        automation: {
                                            ...budgetFormData.automation,
                                            alerts: {
                                                ...budgetFormData.automation.alerts,
                                                thresholds: {
                                                    ...budgetFormData.automation.alerts.thresholds,
                                                    high: parseInt(e.target.value)
                                                }
                                            }
                                        }
                                    })}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-foreground">Medium Threshold ({budgetFormData.automation.alerts.thresholds.medium}%)</label>
                                <input
                                    type="range"
                                    min="25"
                                    max="90"
                                    step="5"
                                    value={budgetFormData.automation.alerts.thresholds.medium}
                                    onChange={(e) => setBudgetFormData({ 
                                        ...budgetFormData, 
                                        automation: {
                                            ...budgetFormData.automation,
                                            alerts: {
                                                ...budgetFormData.automation.alerts,
                                                thresholds: {
                                                    ...budgetFormData.automation.alerts.thresholds,
                                                    medium: parseInt(e.target.value)
                                                }
                                            }
                                        }
                                    })}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {budgetData ? 'Update Budget' : 'Create Budget'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

CreateBudgetModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateBudget: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    wallets: PropTypes.array,
    userId: PropTypes.string,
    budgetData: PropTypes.object
};

export default CreateBudgetModal;
