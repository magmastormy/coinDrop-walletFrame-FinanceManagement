import React from 'react';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../theme/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  if (!theme) return null; // Don't render if theme is not available yet

  return (
    <IconButton
      onClick={toggleTheme}
      style={{
        color: theme.text.primary,
        backgroundColor: theme.background.secondary,
        transition: 'all 0.3s ease-in-out',
        padding: '8px',
        margin: '8px',
      }}
      sx={{
        '&:hover': {
          backgroundColor: isDarkMode ? theme.button.hover : theme.button.base,
          transform: 'scale(1.1)',
        },
      }}
    >
      {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
};

export default ThemeToggle;
