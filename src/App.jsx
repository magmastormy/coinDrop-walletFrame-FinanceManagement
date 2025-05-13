import React, { useMemo, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import Sidebar from './components/Sidebar/sideBar';
import SidebarToggle from './components/Sidebar/SidebarToggle';
import { ThemeProvider } from './theme/ThemeContext';
import { SidebarProvider, SidebarContext } from './components/Sidebar/SidebarContext';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const { isSidebarOpen } = React.useContext(SidebarContext);

  const mainContentClass = useMemo(() => 
    `main-content ${isAuthenticated ? 'with-sidebar' : 'full-width'}`,
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      document.body.classList.toggle('sidebar-open', isSidebarOpen);
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [isSidebarOpen, isAuthenticated]);

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
        theme="colored"
        className="toast-theme-aware"
      />
    </div>
  );
};

const AppContent = () => {
  return <AppLayout />;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SidebarProvider>
          <DataManager>
            <Router>
              <AppContent />
            </Router>
          </DataManager>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
