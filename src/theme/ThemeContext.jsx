import React, { createContext, useContext, useState, useEffect } from 'react';
import './theme.css';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'walletframe-theme';

const lightTheme = {
  background: {
    primary: '#E8F9FD',
    secondary: '#E0F7FA',
  },
  button: {
    base: '#A4D7E1',
    hover: '#B2E0E6',
    text: '#FFFFFF'
  },
  text: {
    primary: '#2C3E50',
    secondary: '#546E7A',
    heading: '#0F3460',
  },
  transition: 'all 0.3s ease-in-out'
};

const darkTheme = {
  background: {
    primary: '#0F0F0F',
    secondary: '#232D3F',
  },
  button: {
    base: '#005B41',
    hover: '#008170',
    text: '#FFFFFF'
  },
  text: {
    primary: '#E5E5E5',
    secondary: '#B0BEC5',
    heading: '#00A389',
  },
  transition: 'all 0.3s ease-in-out'
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // Initialize theme
  useEffect(() => {
    const themeMode = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeMode);
    
    // Update meta theme-color for mobile devices
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        isDarkMode ? theme.background.primary : theme.background.primary
      );
    }

    // Apply theme background to body
    document.body.style.backgroundColor = theme.background.primary;
    document.body.style.color = theme.text.primary;
    
    setIsThemeLoaded(true);
  }, [isDarkMode, theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!isThemeLoaded) {
    return null; // Or a loading spinner if needed
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
