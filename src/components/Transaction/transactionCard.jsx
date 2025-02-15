import React from 'react';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import './styles/transactionCardStyles.css';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
    const { theme, isDarkMode } = useTheme();

    const cardStyle = {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        transition: theme.transition,
        marginBottom: '1rem',
        borderRadius: '8px',
    };

    const buttonStyle = {
        backgroundColor: theme.button.base,
        color: theme.text.primary,
        '&:hover': {
            backgroundColor: theme.button.hover,
        }
    };

    const getAmountColor = () => {
        return transaction.type === 'income' ? '#4CAF50' : '#F44336';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDelete(transaction._id);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card style={cardStyle}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.heading }}
                            >
                                {transaction.description || 'No Description'}
                            </Typography>
                            <Typography 
                                variant="body2"
                                style={{ color: theme.text.secondary }}
                            >
                                {formatDate(transaction.date)}
                            </Typography>
                        </Box>
                        <Typography 
                            variant="h6" 
                            style={{ color: getAmountColor() }}
                        >
                            {formatAmount(transaction.amount, transaction.type)}
                        </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                        <IconButton 
                            onClick={() => onEdit(transaction)}
                            style={buttonStyle}
                            size="small"
                        >
                            <FontAwesomeIcon icon={faEdit} />
                        </IconButton>
                        <IconButton 
                            onClick={handleDelete}
                            style={buttonStyle}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const formatAmount = (amount, type) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(Math.abs(amount));
    return type === 'expense' ? `-${formattedAmount}` : formattedAmount;
};

export default TransactionCard;