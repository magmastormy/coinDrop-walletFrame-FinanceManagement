import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/newGoalCardStyles.css';

const NewGoalCard = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: null, description: '' });
  const [error, setError] = useState('');

  const handleToggle = () => {
    console.log('[NewGoalCard] handleToggle called. open before:', open);
    setOpen(prev => !prev);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (value) => setForm(prev => ({ ...prev, targetDate: value }));

  const handleSubmit = async () => {
    try {
      console.log('[NewGoalCard] handleSubmit called. form:', form);
      
      // Form validation
      if (!form.name.trim()) return setError('Name is required');
      if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) return setError('Target must be greater than 0');
      if (!form.targetDate) return setError('Date is required');
      
      // Format the date properly - ensure it's a valid date string
      let formattedDate;
      try {
        // Check if targetDate is already a Date object or needs conversion
        formattedDate = form.targetDate.toISOString ? form.targetDate.toISOString() : new Date(form.targetDate).toISOString();
      } catch (dateError) {
        console.error('Date formatting error:', dateError);
        return setError('Invalid date format. Please select a valid date.');
      }
      
      // Prepare the payload with properly formatted data
      const payload = {
        name: form.name.trim(),
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: 0,
        deadline: formattedDate,
        description: form.description ? form.description.trim() : ''
      };
      
      console.log('Creating goal with payload:', payload);
      await onCreate(payload);
      
      // Reset form after successful creation
      setForm({ name: '', targetAmount: '', targetDate: null, description: '' });
      setError('');
      setOpen(false);
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create goal');
    }
  };

  return (
    <motion.div layout whileHover={{ scale: 1.02 }} className="new-goal-card">
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">New Goal</Typography>
            <IconButton onClick={handleToggle} size="large" sx={{ width: 48, height: 48 }}>
              <FontAwesomeIcon icon={faPlus} rotation={open ? 90 : 0} size="2x" />
            </IconButton>
          </Box>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    name="name"
                    label="Goal Name"
                    value={form.name}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    name="targetAmount"
                    label="Target Amount"
                    type="number"
                    value={form.targetAmount}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  />
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Target Date"
                      value={form.targetDate}
                      onChange={handleDateChange}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </LocalizationProvider>
                  <TextField
                    name="description"
                    label="Description"
                    value={form.description}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                  />
                  {error && <Typography variant="body2" color="error">{error}</Typography>}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="contained" size="small" onClick={handleSubmit}>Create</Button>
                    <Button variant="text" size="small" onClick={handleToggle}>Cancel</Button>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NewGoalCard;
