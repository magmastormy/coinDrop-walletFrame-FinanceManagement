import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import DataManager from './components/userDataComponent';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <DataManager>
        <Router>
          <div className="app">
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
            <div className="content-wrapper">
              <AppRoutes />
            </div>
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
        </Router>
      </DataManager>
    </Provider>
  );
}

export default App;
