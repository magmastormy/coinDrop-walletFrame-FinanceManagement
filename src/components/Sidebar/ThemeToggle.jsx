import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';

const ThemeToggle = () => {
    const { theme, isDarkMode, toggleTheme } = useTheme();

    const buttonStyle = {
        color: theme.text.primary,
        backgroundColor: theme.button.base + '20',
        '&:hover': {
            backgroundColor: theme.button.hover + '30',
        },
        width: '40px',
        height: '40px',
        borderRadius: '50%',
    };

    return (
        <Tooltip title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`} placement="right">
            <IconButton
                onClick={toggleTheme}
                sx={buttonStyle}
            >
                <FontAwesomeIcon 
                    icon={isDarkMode ? faSun : faMoon} 
                    style={{ fontSize: '1.2rem' }}
                />
            </IconButton>
        </Tooltip>
    );
};

export default ThemeToggle;
