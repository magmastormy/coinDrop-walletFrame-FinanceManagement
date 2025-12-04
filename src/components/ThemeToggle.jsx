import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './ui/Button';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  if (!theme) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="transition-all hover:scale-110"
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
