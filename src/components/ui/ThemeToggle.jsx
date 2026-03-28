import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import Button from './Button';

const ThemeToggle = ({ className }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={className}
        >
            {isDarkMode ? (
                <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
            ) : (
                <Moon className="w-5 h-5 transition-transform duration-300 hover:-rotate-12" />
            )}
        </Button>
    );
};

export { ThemeToggle };
