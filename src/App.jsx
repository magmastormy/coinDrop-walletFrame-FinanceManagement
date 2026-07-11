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
import { LoggerProvider } from './hooks/useLogger';
import CommandPalette from './components/Common/CommandPalette';
import useClerkAuthSync from './hooks/useClerkAuthSync';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

// Inner component so it can access Redux (inside Provider) and Clerk (inside ClerkProvider in main.jsx)
const ClerkReduxBridge = () => {
    useClerkAuthSync();
    return null;
};

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ClerkReduxBridge />
      <ThemeProvider>
        <SidebarProvider>
          <LoggerProvider>
            <DataManager>
              <Router>
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </Router>
            </DataManager>
          </LoggerProvider>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
