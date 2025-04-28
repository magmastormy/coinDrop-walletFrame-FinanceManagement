import React, { useState, useEffect } from 'react';
import budgetService from '../../services/budgetService';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
        startDate: dayjs(),
        endDate: null,
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
                startDate: budgetData.startDate ? dayjs(budgetData.startDate) : dayjs(),
                endDate: budgetData.endDate ? dayjs(budgetData.endDate) : null,
                metadata: {
                    icon: (budgetData.metadata && budgetData.metadata.icon) ? budgetData.metadata.icon : 'budget',
                    color: (budgetData.metadata && budgetData.metadata.color) ? budgetData.metadata.color : '#007bff'
                }
            });
        }
    }, [budgetData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        // Ensure all required fields are present
        if (!budgetFormData.name || !budgetFormData.amount || !budgetFormData.categoryId || !budgetFormData.walletId || !budgetFormData.type) {
            setError('All fields are required: name, amount, category, wallet, and type');
            setLoading(false);
            return;
        }
        
        try {
            // Find the selected category
            const selectedCategory = categories.find(cat => cat._id === budgetFormData.categoryId);
            
            const budgetData = {
                name: budgetFormData.name,
                amount: parseFloat(budgetFormData.amount),
                categoryId: budgetFormData.categoryId,
                category: budgetFormData.categoryId, // Map categoryId to category
                walletId: budgetFormData.walletId,
                userId: userId,
                type: budgetFormData.type, // Use the selected type
                startDate: budgetFormData.startDate ? budgetFormData.startDate.toISOString().split('T')[0] : dayjs().toISOString().split('T')[0],
                period: budgetFormData.period || 'monthly',
            };
            
            const result = await budgetService.createBudget(budgetData);
            
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
            amount: '',
            categoryId: '',
            walletId: '',
            type: 'expense',
            period: 'monthly',
            startDate: dayjs(),
            endDate: null,
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

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{budgetData ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ display:'grid', gap:2, pt:1 }}>
                    <TextField label="Name" value={budgetFormData.name} onChange={e => setBudgetFormData({ ...budgetFormData, name: e.target.value })} required fullWidth />
                    <TextField label="Amount" type="number" value={budgetFormData.amount} onChange={e => setBudgetFormData({ ...budgetFormData, amount: e.target.value })} required fullWidth />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select value={budgetFormData.type} onChange={e => setBudgetFormData({ ...budgetFormData, type: e.target.value })}>
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                            <MenuItem value="savings">Savings</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select value={budgetFormData.categoryId} onChange={e => setBudgetFormData({ ...budgetFormData, categoryId: e.target.value })} required>
                            {categories.map(cat => <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="wallet-select-label">Wallet</InputLabel>
                        <Select
                            labelId="wallet-select-label"
                            id="wallet-select"
                            value={budgetFormData.walletId}
                            label="Wallet"
                            onChange={e => setBudgetFormData({ ...budgetFormData, walletId: e.target.value })}
                            required
                        >
                            <MenuItem value="" disabled>Select Wallet</MenuItem>
                            {walletOptions.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Start Date"
                            value={budgetFormData.startDate}
                            onChange={date => setBudgetFormData({ ...budgetFormData, startDate: date })}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                            label="End Date"
                            value={budgetFormData.endDate}
                            onChange={date => setBudgetFormData({ ...budgetFormData, endDate: date })}
                            slotProps={{ textField: { fullWidth: true, required: true } }}
                        />
                    </LocalizationProvider>
                    {error && <Typography color="error">{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateBudgetModal;