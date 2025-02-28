import React, { useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import Sidebar from './components/Sidebar/sideBar';
import SidebarToggle from './components/Sidebar/SidebarToggle';
import { ThemeProvider } from './theme/ThemeContext';
import { SidebarProvider } from './components/Sidebar/SidebarContext';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

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
    <ThemeProvider>
      <SidebarProvider>
        <Provider store={store}>
          <DataManager>
            <Router>
              <AppContent />
            </Router>
          </DataManager>
        </Provider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
