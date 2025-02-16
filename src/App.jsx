import React, { useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import Sidebar from './components/Sidebar/sideBar';
import SidebarToggle from './components/Sidebar/SidebarToggle';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { SidebarProvider } from './components/Sidebar/SidebarContext';
import { useAuth } from './contexts/authContext';
import './App.css';

// Temporary wrapper until styled-components is installed
const StyledComponentsWrapper = ({ children }) => {
  const { theme } = useTheme();
  
  React.useEffect(() => {
    if (!theme) return;
    
    document.body.style.backgroundColor = theme.background.primary;
    document.body.style.color = theme.text.primary;
    document.body.style.transition = 'all 0.3s ease-in-out';
  }, [theme]);

  if (!theme) return null;

  return children;
};

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const mainContentClass = useMemo(() => 
    `main-content ${isAuthenticated ? 'with-sidebar' : 'full-width'}`,
    [isAuthenticated]
  );

  return (
    <div className="app">
      {isAuthenticated && (
        <>
          <Sidebar />
          <SidebarToggle />
        </>
      )}
      <main className={mainContentClass}>
        <AppRoutes />
      </main>
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
        theme="light"
      />
    </div>
  );
};

const AppContent = () => {
  // Wrap the layout in its own component to ensure consistent hook order
  return <AppLayout />;
};

function App() {
  return (
    <ThemeProvider>
      <StyledComponentsWrapper>
        <SidebarProvider>
          <Provider store={store}>
            <DataManager>
              <Router>
                <AppContent />
              </Router>
            </DataManager>
          </Provider>
        </SidebarProvider>
      </StyledComponentsWrapper>
    </ThemeProvider>
  );
}

export default App;
