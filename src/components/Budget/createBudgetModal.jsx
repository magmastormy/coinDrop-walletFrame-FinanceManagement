import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import budgetService from '../../services/budgetService';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Loader2, Calendar, Wallet, Tag, DollarSign, PieChart } from 'lucide-react';
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

        // Validate required fields
        if (!budgetFormData.name || !budgetFormData.amount || !budgetFormData.categoryId || !budgetFormData.walletId || !budgetFormData.type) {
            setError('All fields are required: name, amount, category, wallet, and type');
            setLoading(false);
            return;
        }

        // Validate amount is a positive number
        const amount = parseFloat(budgetFormData.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Amount must be a positive number');
            setLoading(false);
            return;
        }

        try {
            const budgetPayload = {
                name: budgetFormData.name,
                amount: amount,
                categoryId: budgetFormData.categoryId,
                walletId: budgetFormData.walletId,
                userId: userId,
                type: budgetFormData.type,
                startDate: budgetFormData.startDate,
                endDate: budgetFormData.endDate || null,
                period: budgetFormData.period || 'monthly',
            };

            console.log('[DEBUG] Budget data being sent:', budgetPayload);

            if (budgetData) {
                await budgetService.updateBudget(budgetData._id, budgetPayload);
            } else {
                await budgetService.createBudget(budgetPayload);
            }

            onCreateBudget();
            resetForm();
            onClose();
        } catch (err) {
            console.error('[DEBUG] Budget creation error:', err);
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
            }
        });
        setError(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={budgetData ? 'Edit Budget' : 'Create New Budget'}
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Budget Name"
                    value={budgetFormData.name}
                    onChange={e => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                    placeholder="e.g., Monthly Groceries"
                    required
                    fullWidth
                />

                <Input
                    label="Amount"
                    type="number"
                    value={budgetFormData.amount}
                    onChange={e => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                    placeholder="0.00"
                    icon={DollarSign}
                    required
                    fullWidth
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Type</label>
                    <div className="relative">
                        <PieChart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={budgetFormData.type}
                            onChange={e => setBudgetFormData({ ...budgetFormData, type: e.target.value })}
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="savings">Savings</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={budgetFormData.categoryId}
                            onChange={e => setBudgetFormData({ ...budgetFormData, categoryId: e.target.value })}
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            required
                        >
                            <option value="" disabled>Select Category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Wallet</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={budgetFormData.walletId}
                            onChange={e => setBudgetFormData({ ...budgetFormData, walletId: e.target.value })}
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            required
                        >
                            <option value="" disabled>Select Wallet</option>
                            {walletOptions.map(w => (
                                <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={budgetFormData.startDate}
                                onChange={e => setBudgetFormData({ ...budgetFormData, startDate: e.target.value })}
                                className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={budgetFormData.endDate}
                                onChange={e => setBudgetFormData({ ...budgetFormData, endDate: e.target.value })}
                                className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
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
