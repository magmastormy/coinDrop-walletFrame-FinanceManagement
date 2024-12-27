import React, { useState } from 'react';
import budgetService from '../../services/budgetService';
import './styles/budgetCreateStyles.css';

const CreateBudgetModal = ({ isOpen, onClose, onBudgetCreated, categories }) => {
    const [budgetData, setBudgetData] = useState({
        name: '',
        amount: 0,
        type: 'monthly',
        categoryId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        metadata: {
            icon: 'budget',
            color: '#007bff'
        }
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (!budgetData.categoryId) {
                throw new Error('Please select a category');
            }

            const amount = parseFloat(budgetData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            await budgetService.createBudget(budgetData);
            onBudgetCreated();
            setBudgetData({ name: '', amount: 0, type: 'monthly', category: '', startDate: '', endDate: '', metadata: { icon: 'budget', color: '#007bff' } });
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Create New Budget</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="budgetName">Budget Name</label>
                        <input
                            id="budgetName"
                            type="text"
                            value={budgetData.name}
                            onChange={e => setBudgetData({ ...budgetData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetAmount">Amount</label>
                        <input
                            id="budgetAmount"
                            type="number"
                            value={budgetData.amount}
                            onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetType">Type</label>
                        <select
                            id="budgetType"
                            value={budgetData.type}
                            onChange={e => setBudgetData({ ...budgetData, type: e.target.value })}
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
                            value={budgetData.categoryId}
                            onChange={e => setBudgetData({ ...budgetData, categoryId: e.target.value })}
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
                        <label htmlFor="startDate">Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            value={budgetData.startDate}
                            onChange={e => setBudgetData({ ...budgetData, startDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endDate">End Date</label>
                        <input
                            id="endDate"
                            type="date"
                            value={budgetData.endDate}
                            onChange={e => setBudgetData({ ...budgetData, endDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budgetIcon">Icon</label>
                        <select
                            id="budgetIcon"
                            value={budgetData.metadata.icon}
                            onChange={e => setBudgetData({
                                ...budgetData,
                                metadata: {
                                    ...budgetData.metadata,
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
                    <button type="submit">Create Budget</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default CreateBudgetModal;