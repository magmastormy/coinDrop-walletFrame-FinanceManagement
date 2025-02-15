import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';
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
    loading
}) => {
    const [formState, setFormState] = React.useState({
        name: '',
        initialBalance: '',
        automation: {
            type: 'fixed',
            amount: '',
            frequency: 'monthly'
        }
    });

    React.useEffect(() => {
        if (account) {
            setFormState({
                name: account.name || '',
                initialBalance: account.balance || 0,
                automation: account.automation || {
                    type: 'fixed',
                    amount: '',
                    frequency: 'monthly'
                }
            });
        }
    }, [account]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formState,
            balance: parseFloat(formState.initialBalance)
        });
    };

    const handleAutomationChange = (field, value) => {
        setFormState(prev => ({
            ...prev,
            automation: {
                ...prev.automation,
                [field]: value
            }
        }));
    };

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <StyledDialogTitle>Edit Savings Account</StyledDialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <StyledFormControl>
                            <TextField
                                label="Account Name"
                                value={formState.name}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                fullWidth
                                required
                            />
                        </StyledFormControl>

                        <StyledFormControl>
                            <TextField
                                label="Current Balance"
                                type="number"
                                value={formState.initialBalance}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    initialBalance: e.target.value
                                }))}
                                fullWidth
                                InputProps={{ 
                                    startAdornment: <span>$</span>,
                                    inputProps: { min: 0, step: "0.01" }
                                }}
                                required
                            />
                        </StyledFormControl>

                        <StyledFormControl>
                            <InputLabel>Automation Type</InputLabel>
                            <Select
                                value={formState.automation.type}
                                onChange={(e) => handleAutomationChange('type', e.target.value)}
                                label="Automation Type"
                            >
                                <MenuItem value="fixed">Fixed Amount</MenuItem>
                                <MenuItem value="percentage">Percentage of Income</MenuItem>
                                <MenuItem value="none">No Automation</MenuItem>
                            </Select>
                        </StyledFormControl>

                        {formState.automation.type !== 'none' && (
                            <>
                                <StyledFormControl>
                                    <TextField
                                        label={formState.automation.type === 'fixed' ? 'Amount' : 'Percentage'}
                                        type="number"
                                        value={formState.automation.amount}
                                        onChange={(e) => handleAutomationChange('amount', e.target.value)}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: formState.automation.type === 'fixed' ? <span>$</span> : <span>%</span>,
                                            inputProps: { 
                                                min: 0,
                                                max: formState.automation.type === 'percentage' ? 100 : undefined,
                                                step: formState.automation.type === 'percentage' ? "1" : "0.01"
                                            }
                                        }}
                                    />
                                </StyledFormControl>

                                <StyledFormControl>
                                    <InputLabel>Frequency</InputLabel>
                                    <Select
                                        value={formState.automation.frequency}
                                        onChange={(e) => handleAutomationChange('frequency', e.target.value)}
                                        label="Frequency"
                                    >
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                    </Select>
                                </StyledFormControl>
                            </>
                        )}
                    </Box>
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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </StyledDialog>
    );
};

export default SavingsAccountEditDialog;