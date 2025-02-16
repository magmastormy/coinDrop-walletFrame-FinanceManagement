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
    Box
} from '@mui/material';
import { useTheme } from '../../theme/ThemeContext';
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
    const { isDarkMode } = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

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
            className={`savings-account-card ${isSelected ? 'selected' : ''}`}
            sx={{
                borderRadius: 2,
                p: 3,
                position: 'relative',
                height: '280px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box className="card-header">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div className="savings-icon-container">
                        <FontAwesomeIcon icon={faPiggyBank} size="lg" />
                    </div>
                    <Typography variant="h6" className="account-name">
                        {account.name}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleMenuClick}
                    size="small"
                    className="menu-button"
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', mb: 3 }}>
                <Typography variant="h4" className="balance">
                    {formatCurrency(account.balance)}
                </Typography>
                <Typography variant="body2" className="goal-text">
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
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }
                }}
            >
                <MenuItem onClick={handleOptionClick('edit')}>Edit</MenuItem>
                <MenuItem onClick={handleOptionClick('transfer')}>Transfer</MenuItem>
                <MenuItem onClick={handleOptionClick('delete')} sx={{ color: 'red' }}>
                    Delete
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default SavingsAccountCard;
