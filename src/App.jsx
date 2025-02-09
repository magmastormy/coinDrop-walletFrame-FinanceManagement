import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './slices/store';
import AppRoutes from './routes';
import 'react-toastify/dist/ReactToastify.css';
import DataManager from './components/userDataComponent';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <DataManager>
        <Router>
          <div className="app">
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
