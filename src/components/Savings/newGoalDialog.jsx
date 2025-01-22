import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField 
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers';
import { savingsGoalService } from '../../services/savingsGoalService';
import { addSavingsGoal, setError } from '../../slices/savingsGoalSlice';
import dayjs from 'dayjs';
import './styles/newGoalDialogStyles.css';

const NewGoalDialog = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: null,
        description: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setFormError('Name is required');
            return false;
        }
        if (!formData.targetAmount || formData.targetAmount <= 0) {
            setFormError('Target amount must be greater than 0');
            return false;
        }
        if (!formData.currentAmount || formData.currentAmount < 0) {
            setFormError('Current amount cannot be negative');
            return false;
        }
        if (!formData.targetDate) {
            setFormError('Target date is required');
            return false;
        }
        if (formData.targetDate.isBefore(dayjs())) {
            setFormError('Target date must be in the future');
            return false;
        }
        if (Number(formData.currentAmount) > Number(formData.targetAmount)) {
            setFormError('Current amount cannot be greater than target amount');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const goalData = {
                ...formData,
                userId: user.id,
                targetDate: formData.targetDate.toISOString(),
                deadline: formData.targetDate.toISOString()
            };

            const response = await savingsGoalService.createSavingsGoal(goalData);
            dispatch(addSavingsGoal(response.data));
            onClose();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} className="new-goal-dialog">
            <DialogTitle>Create New Savings Goal</DialogTitle>
            <DialogContent>
                {formError && (
                    <div className="error-message">
                        {formError}
                    </div>
                )}
                <TextField
                    name="name"
                    label="Goal Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    name="targetAmount"
                    label="Target Amount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                        startAdornment: <span>$</span>
                    }}
                />
                <TextField
                    name="currentAmount"
                    label="Current Amount"
                    type="number"
                    value={formData.currentAmount}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                        startAdornment: <span>$</span>
                    }}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Target Date"
                        value={formData.targetDate}
                        onChange={(newValue) => {
                            setFormData(prev => ({
                                ...prev,
                                targetDate: newValue
                            }));
                        }}
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
                    onChange={handleInputChange}
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
                    Create Goal
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewGoalDialog;
