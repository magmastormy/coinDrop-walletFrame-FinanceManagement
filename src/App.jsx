import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import {store}  from './slices/store';
import AppRoutes from './routes';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <div className="content-wrapper">
            <AppRoutes />
          </div>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
