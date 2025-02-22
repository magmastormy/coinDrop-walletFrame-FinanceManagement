import React, { useState, useEffect } from 'react';
import budgetService from '../../services/budgetService';
import './styles/budgetCreateStyles.css';

const CreateBudgetModal = ({ isOpen, onClose, onCreateBudget, categories, wallets = [], userId, budgetData }) => {
    const [budgetFormData, setBudgetFormData] = useState({
        name: '',
        amount: 0,
        type: 'monthly',
        categoryId: '',
        walletId: '',
        startDate: new Date().toISOString().split('T')[0],
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
                startDate: budgetData.startDate ? budgetData.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                endDate: budgetData.endDate ? budgetData.endDate.split('T')[0] : '',
                metadata: {
                    icon: (budgetData.metadata && budgetData.metadata.icon) ? budgetData.metadata.icon : 'budget',
                    color: (budgetData.metadata && budgetData.metadata.color) ? budgetData.metadata.color : '#007bff'
                }
            });
        }
    }, [budgetData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!budgetFormData.categoryId || !budgetFormData.walletId) {
                throw new Error('[BudgetCreateModal] Please select a category and a wallet');
            }

            const amount = parseFloat(budgetFormData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('[BudgetCreateModal] Please enter a valid amount');
            }

            if (budgetData) {
                await budgetService.updateBudget(budgetData._id, budgetFormData);
            } else {
                await budgetService.createBudget(userId, budgetFormData);
            }

            onCreateBudget();
            resetForm();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setBudgetFormData({
            name: '',
            amount: 0,
            type: 'monthly',
            categoryId: '',
            walletId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            metadata: {
                icon: 'budget',
                color: '#007bff'
            }
        });
    };

    const validateBudget = (budget) => {
        const amount = parseFloat(budget.amount);
        if (isNaN(amount) || amount <= 0) {
            return 'Amount must be a positive number';
        }
        if (!budget.category) {
            return 'Category is required';
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>{budgetData ? 'Edit Budget' : 'Create New Budget'}</h2>
                {error && <div className="error-message">{error}</div>}
                {loading && <div className="loading-message">Creating budget...</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="budgetName">Budget Name</label>
                        <input
                            id="budgetName"
                            type="text"
                            value={budgetFormData.name}
                            onChange={e => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetAmount">Amount</label>
                        <input
                            id="budgetAmount"
                            type="number"
                            value={budgetFormData.amount}
                            onChange={e => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetType">Type</label>
                        <select
                            id="budgetType"
                            value={budgetFormData.type}
                            onChange={e => setBudgetFormData({ ...budgetFormData, type: e.target.value })}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetCategory">Category</label>
                        <select
                            id="budgetCategory"
                            value={budgetFormData.categoryId}
                            onChange={e => setBudgetFormData({ ...budgetFormData, categoryId: e.target.value })}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="walletId">Wallet</label>
                        <select
                            id="walletId"
                            value={budgetFormData.walletId}
                            onChange={e => setBudgetFormData({ ...budgetFormData, walletId: e.target.value })}
                            required
                        >
                            <option value="">Select Wallet</option>
                            {wallets.wallets.map(wallet => (
                                <option key={wallet._id} value={wallet._id}>
                                    {wallet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="startDate">Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            value={budgetFormData.startDate}
                            onChange={e => setBudgetFormData({ ...budgetFormData, startDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endDate">End Date</label>
                        <input
                            id="endDate"
                            type="date"
                            value={budgetFormData.endDate}
                            onChange={e => setBudgetFormData({ ...budgetFormData, endDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetIcon">Icon</label>
                        <select
                            id="budgetIcon"
                            value={budgetFormData.metadata.icon}
                            onChange={e => setBudgetFormData({
                                ...budgetFormData,
                                metadata: {
                                    ...budgetFormData.metadata,
                                    icon: e.target.value
                                }
                            })}
                        >
                            <option value="budget">Budget</option>
                            <option value="savings">Savings</option>
                            <option value="expenses">Expenses</option>
                            {/* Add more icons as needed */}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="submit">{budgetData ? 'Update Budget' : 'Create Budget'}</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBudgetModal;