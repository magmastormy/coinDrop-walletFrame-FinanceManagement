import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import { ThemeProvider } from './theme/ThemeContext';
import { SidebarProvider } from './components/Sidebar/SidebarContext';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = () => {
  return (
    <div className="app">
      <AppRoutes />
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
              <AppLayout />
            </Router>
          </DataManager>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
