import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const ThemeToggle = () => {
    const { theme, isDarkMode, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
                "w-10 h-10 rounded-full transition-all",
                "hover:bg-white/10 hover:scale-110"
            )}
            aria-label={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
        >
            {isDarkMode ? (
                <Sun className="w-5 h-5 text-foreground" />
            ) : (
                <Moon className="w-5 h-5 text-foreground" />
            )}
        </Button>
    );
};

export default ThemeToggle;
