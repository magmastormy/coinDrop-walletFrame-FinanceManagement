import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

const SavingsAccountEditDialog = ({
    open,
    onClose,
    account,
    onSave,
    loading,
    isNewAccount = false
}) => {
    const [formData, setFormData] = useState({
        name: '',
        initialBalance: 0,
        automation: {
            enabled: false,
            type: 'fixed',
            amount: 0,
            percentage: 0,
            frequency: 'weekly',
            nextExecutionDate: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name || '',
                initialBalance: account.balance || 0,
                automation: {
                    enabled: account.automation?.enabled || false,
                    type: account.automation?.type || 'fixed',
                    amount: account.automation?.amount || 0,
                    percentage: account.automation?.percentage || 0,
                    frequency: account.automation?.frequency || 'weekly',
                    nextExecutionDate: account.automation?.nextExecutionDate
                        ? new Date(account.automation.nextExecutionDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                }
            });
        } else {
            setFormData({
                name: '',
                initialBalance: 0,
                automation: {
                    enabled: false,
                    type: 'fixed',
                    amount: 0,
                    percentage: 0,
                    frequency: 'weekly',
                    nextExecutionDate: new Date().toISOString().split('T')[0]
                }
            });
        }
    }, [account, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('automation.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                automation: {
                    ...prev.automation,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSwitchChange = (e) => {
        setFormData(prev => ({
            ...prev,
            automation: {
                ...prev.automation,
                enabled: e.target.checked
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={isNewAccount ? 'Create Savings Account' : 'Edit Savings Account'}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Account Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Emergency Fund"
                />

                {isNewAccount && (
                    <Input
                        label="Initial Balance"
                        name="initialBalance"
                        type="number"
                        value={formData.initialBalance}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />
                )}

                <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                    }}
                >
                    <input
                        type="checkbox"
                        id="automation-enabled"
                        checked={formData.automation.enabled}
                        onChange={handleSwitchChange}
                        className="w-5 h-5 rounded text-primary focus:ring-primary"
                        style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-1)'
                        }}
                    />
                    <label htmlFor="automation-enabled" className="text-sm font-medium cursor-pointer select-none">
                        Enable Automatic Contributions
                    </label>
                </div>

                {formData.automation.enabled && (
                    <div
                        className="space-y-4 p-4 rounded-xl animate-in fade-in slide-in-from-top-2"
                        style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                        }}
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Contribution Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="automation.type"
                                        value="fixed"
                                        checked={formData.automation.type === 'fixed'}
                                        onChange={handleChange}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">Fixed Amount</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="automation.type"
                                        value="percentage"
                                        checked={formData.automation.type === 'percentage'}
                                        onChange={handleChange}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">Percentage</span>
                                </label>
                            </div>
                        </div>

                        {formData.automation.type === 'fixed' ? (
                            <Input
                                label="Contribution Amount"
                                name="automation.amount"
                                type="number"
                                value={formData.automation.amount}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        ) : (
                            <Input
                                label="Contribution Percentage (%)"
                                name="automation.percentage"
                                type="number"
                                value={formData.automation.percentage}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="1"
                                placeholder="10"
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                                <select
                                    name="automation.frequency"
                                    value={formData.automation.frequency}
                                    onChange={handleChange}
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
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            <Input
                                label="Next Execution Date"
                                name="automation.nextExecutionDate"
                                type="date"
                                value={formData.automation.nextExecutionDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="min-w-[100px]"
                    >
                        {loading ? 'Saving...' : isNewAccount ? 'Create Account' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SavingsAccountEditDialog;

