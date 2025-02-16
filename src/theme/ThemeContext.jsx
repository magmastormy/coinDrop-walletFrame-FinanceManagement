import React, { createContext, useContext, useState, useEffect } from 'react';
import './theme.css';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'walletframe-theme';

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // Initialize theme
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile devices
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        isDarkMode ? 'var(--dark-primary-50)' : 'var(--primary-50)'
      );
    }
    
    setIsThemeLoaded(true);
  }, [isDarkMode]);

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
    <ThemeContext.Provider 
      value={{
        isDarkMode,
        toggleTheme,
        theme: isDarkMode ? 'dark' : 'light'
      }}
    >
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
