import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPiggyBank, 
    faPlus, 
    faMinus, 
    faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import { 
    IconButton, 
    Menu, 
    MenuItem,
    Typography,
    Paper,
    useTheme,
    Box
} from '@mui/material';
import './styles/savingsAccountCardStyles.css';

const SavingsAccountCard = ({ 
    account, 
    onDeposit,
    onWithdraw,
    onEdit,
    onTransfer,
    onDelete,
    onSelect,
    isSelected
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();

    const formatCurrency = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(balance);
    };

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

    const handleOptionClick = (action) => (event) => {
        event.stopPropagation();
        handleMenuClose(event);
        switch(action) {
            case 'edit':
                onEdit(account._id);
                break;
            case 'transfer':
                onTransfer(account._id);
                break;
            case 'delete':
                onDelete(account._id);
                break;
            default:
                break;
        }
    };

    return (
        <Paper 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => onSelect(account._id)}
            elevation={2}
            className="savings-account-card"
            sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#2d3748' : theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRadius: 2,
                p: 3,
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                height: '280px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                boxShadow: isSelected ? theme.shadows[4] : theme.shadows[2],
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div className="savings-icon-container" style={{ 
                        backgroundColor: theme.palette.primary.main + '20',
                        color: theme.palette.primary.main 
                    }}>
                        <FontAwesomeIcon icon={faPiggyBank} size="lg" />
                    </div>
                    <Typography variant="h6" component="h3" sx={{ 
                        color: theme.palette.text.primary,
                        fontWeight: 600
                    }}>
                        {account.name}
                    </Typography>
                </Box>
                <IconButton 
                    size="small"
                    onClick={handleMenuClick}
                    sx={{ color: theme.palette.text.secondary }}
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </IconButton>
            </Box>
            
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" sx={{ 
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 1,
                    textAlign: 'center'
                }}>
                    {formatCurrency(account.balance)}
                </Typography>
                <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    textAlign: 'center'
                }}>
                    Goal: {formatCurrency(account.goal || 0)}
                </Typography>
            </Box>

            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center'
            }}>
                <button 
                    className="action-btn deposit"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeposit(account._id);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Deposit
                </button>
                <button 
                    className="action-btn withdraw"
                    onClick={(e) => {
                        e.stopPropagation();
                        onWithdraw(account._id);
                    }}
                >
                    <FontAwesomeIcon icon={faMinus} /> Withdraw
                </button>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 120,
                        boxShadow: theme.shadows[2]
                    }
                }}
            >
                <MenuItem onClick={handleOptionClick('edit')}>Edit</MenuItem>
                <MenuItem onClick={handleOptionClick('transfer')}>Transfer</MenuItem>
                <MenuItem onClick={handleOptionClick('delete')} sx={{ color: theme.palette.error.main }}>
                    Delete
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default SavingsAccountCard;
