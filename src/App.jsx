import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import { ThemeProvider } from './theme/ThemeContext';
import { SidebarProvider } from './components/Sidebar/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary/errorBoundary';
import CommandPalette from './components/Common/CommandPalette';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = () => {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut for command palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <AppRoutes />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="toast-theme-aware"
      />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SidebarProvider>
          <DataManager>
            <Router>
              <ErrorBoundary>
                <AppLayout />
              </ErrorBoundary>
            </Router>
          </DataManager>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
