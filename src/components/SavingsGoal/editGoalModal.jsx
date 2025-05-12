import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { useDispatch } from 'react-redux';
import { updateSavingsGoal } from '../../slices/savingsGoalSlice';
import savingsGoalService from '../../services/savingsGoalService';
import dayjs from 'dayjs';

const EditGoalModal = ({ open, onClose, goal }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: null,
        description: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (goal) {
            setFormData({
                name: goal.name || '',
                targetAmount: goal.targetAmount || '',
                currentAmount: goal.currentAmount || '',
                targetDate: goal.targetDate ? dayjs(goal.targetDate) : null,
                description: goal.description || ''
            });
        }
    }, [goal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            targetDate: date
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Goal name is required');
            return false;
        }
        if (!formData.targetAmount || formData.targetAmount <= 0) {
            setError('Target amount must be greater than 0');
            return false;
        }
        if (!formData.targetDate) {
            setError('Target date is required');
            return false;
        }
        if (formData.targetDate.isBefore(dayjs())) {
            setError('Target date must be in the future');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const updatedGoal = await savingsGoalService.updateSavingsGoal(goal._id, {
                ...formData,
                targetDate: formData.targetDate.toISOString(),
                deadline: formData.targetDate.toISOString()
            });
            dispatch(updateSavingsGoal(updatedGoal));
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to update savings goal');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Savings Goal</DialogTitle>
            <DialogContent>
                {error && (
                    <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                <TextField
                    name="name"
                    label="Goal Name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    name="targetAmount"
                    label="Target Amount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    name="currentAmount"
                    label="Current Amount"
                    type="number"
                    value={formData.currentAmount}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Target Date"
                        value={formData.targetDate}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                            <TextField {...params} fullWidth margin="normal" />
                        )}
                        minDate={dayjs()}
                    />
                </LocalizationProvider>
                <TextField
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color="primary" variant="contained">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditGoalModal;