import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        padding: theme.spacing(2)
    }
}));

const StyledDialogTitle = styled(DialogTitle)({
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 600
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    width: '100%'
}));

const SavingsAccountEditDialog = ({ 
    open,
    onClose,
    account,
    onSave,
    loading,
    isNewAccount = false
}) => {
    const { user } = useAuth();
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
        <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <StyledDialogTitle>
                    {isNewAccount ? 'Create Savings Account' : 'Edit Savings Account'}
                </StyledDialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Account Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        
                        {isNewAccount && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Initial Balance"
                                    name="initialBalance"
                                    type="number"
                                    value={formData.initialBalance}
                                    onChange={handleChange}
                                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.automation.enabled}
                                        onChange={handleSwitchChange}
                                        name="automation.enabled"
                                    />
                                }
                                label="Enable Automatic Contributions"
                            />
                        </Grid>

                        {formData.automation.enabled && (
                            <>
                                <Grid item xs={12}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Contribution Type</FormLabel>
                                        <RadioGroup
                                            row
                                            name="automation.type"
                                            value={formData.automation.type}
                                            onChange={handleChange}
                                        >
                                            <FormControlLabel value="fixed" control={<Radio />} label="Fixed Amount" />
                                            <FormControlLabel value="percentage" control={<Radio />} label="Percentage" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                                
                                {formData.automation.type === 'fixed' && (
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Contribution Amount"
                                            name="automation.amount"
                                            type="number"
                                            value={formData.automation.amount}
                                            onChange={handleChange}
                                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                                        />
                                    </Grid>
                                )}
                                
                                {formData.automation.type === 'percentage' && (
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Contribution Percentage"
                                            name="automation.percentage"
                                            type="number"
                                            value={formData.automation.percentage}
                                            onChange={handleChange}
                                            InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                                        />
                                    </Grid>
                                )}
                                
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Frequency</InputLabel>
                                        <Select
                                            name="automation.frequency"
                                            value={formData.automation.frequency}
                                            onChange={handleChange}
                                            label="Frequency"
                                        >
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                            <MenuItem value="monthly">Monthly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Next Execution Date"
                                        name="automation.nextExecutionDate"
                                        type="date"
                                        value={formData.automation.nextExecutionDate}
                                        onChange={handleChange}
                                        InputProps={{ inputProps: { min: new Date().toISOString().split('T')[0] } }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ padding: 2 }}>
                    <Button onClick={onClose} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : isNewAccount ? 'Create Account' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </StyledDialog>
    );
};

export default SavingsAccountEditDialog;