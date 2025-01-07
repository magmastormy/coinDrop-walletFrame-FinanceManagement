import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { savingsGoalService } from '../../services/savingsGoalService';
import { addSavingsGoal, setError } from '../../slices/savingsGoalSlice';
import './styles/newGoalDialogStyles.css';

const NewGoalDialog = ({ open, onClose, onComplete }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    
    const [goalData, setGoalData] = useState({
        name: '',
        targetAmount: '',
        deadline: null,
        description: ''
    });
    const [error, setLocalError] = useState('');

    const handleChange = (field) => (event) => {
        setGoalData({
            ...goalData,
            [field]: event.target.value
        });
    };

    const handleDateChange = (date) => {
        setGoalData({
            ...goalData,
            deadline: date
        });
    };

    const validateForm = () => {
        if (!goalData.name.trim()) {
            setLocalError('Please enter a goal name');
            return false;
        }
        
        const amount = parseFloat(goalData.targetAmount);
        if (isNaN(amount) || amount <= 0) {
            setLocalError('Please enter a valid target amount');
            return false;
        }

        if (!goalData.deadline) {
            setLocalError('Please select a deadline');
            return false;
        }

        if (goalData.deadline < new Date()) {
            setLocalError('Deadline cannot be in the past');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const newGoal = {
                ...goalData,
                userId: user._id,
                currentAmount: 0,
                progress: 0
            };

            const response = await savingsGoalService.createSavingsGoal(newGoal);
            dispatch(addSavingsGoal(response));
            onComplete();
            onClose();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            className="new-goal-dialog"
            aria-labelledby="new-goal-dialog-title"
        >
            <DialogTitle id="new-goal-dialog-title">
                Create New Savings Goal
            </DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Goal Name"
                    value={goalData.name}
                    onChange={handleChange('name')}
                    error={error.includes('name')}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Target Amount"
                    type="number"
                    value={goalData.targetAmount}
                    onChange={handleChange('targetAmount')}
                    error={error.includes('amount')}
                    InputProps={{
                        inputProps: { 
                            min: 0,
                            step: "0.01"
                        }
                    }}
                />

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Deadline"
                        value={goalData.deadline}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                margin="normal"
                                error={error.includes('deadline')}
                            />
                        )}
                        minDate={new Date()}
                    />
                </LocalizationProvider>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Description (Optional)"
                    multiline
                    rows={3}
                    value={goalData.description}
                    onChange={handleChange('description')}
                />

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
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
