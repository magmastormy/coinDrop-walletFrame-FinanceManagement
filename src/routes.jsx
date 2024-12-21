import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './components/Auth/userLoginForm';
import Register from './components/Auth/userRegistrationForm';
import Dashboard from './pages/Dashboard';
import Wallet from './components/Wallet/walletManager';
import Budget from './components/Budget/budgetManager';
import Transaction from './components/Transaction/transactionManager';
import Home from './pages/Home';
import Sidebar from './components/Sidebar/sideBar';
import Profile from './components/Profile/profileManager';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const AppRoutes = () => {
    const {isAuthenticated} = useSelector(state => state.auth);
    return (
        <div className="app-container">
            {isAuthenticated && <Sidebar isAuthenticated={isAuthenticated} />}
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/wallet" element={
                    <ProtectedRoute>
                        <Wallet />
                    </ProtectedRoute>
                } />
                <Route path="/budget" element={
                    <ProtectedRoute>
                        <Budget />
                    </ProtectedRoute>
                } />
                <Route path="/transaction" element={
                    <ProtectedRoute>
                        <Transaction />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                
                {/* Home Route */}
                <Route path="/" element={<Home />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

export default AppRoutes; 