import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './components/Auth/userLoginForm';
import Register from './components/Auth/userRegistrationForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard/dashboardManager';
import Wallet from './components/Wallet/walletManager';
import Budget from './components/Budget/budgetManager';
import Transaction from './components/Transaction/transactionManager';
import Home from './pages/Home';
import Profile from './components/Profile/profileManager';
import Category from './components/Category/categoryManager';
import Education from './components/Education/educationManager';
import UserEducation from './components/Education/userEducation/userEducationManager';
import SavingGoal from './components/SavingsGoal/savingsGoalManager';
import SavingAccount from './components/Savings/savingsAccountManager';
import ChatBot from './components/Chatbot/chatbotManager';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const location = useLocation();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

// Public Route Component - redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const location = useLocation();
    
    if (isAuthenticated) {
        if (location.pathname === '/') {
            return children;
        }
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

const AppRoutes = () => {
    return (
        <div className="app-container">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                    <PublicRoute>
                        <Home />
                    </PublicRoute>
                } />
                
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />

                <Route path="/forgot-password" element={
                    <PublicRoute>
                        <ForgotPassword />
                    </PublicRoute>
                } />
                <Route path="/reset-password" element={
                    <PublicRoute>
                        <ForgotPassword />
                    </PublicRoute>
                } />
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

                <Route path="/category" element={
                    <ProtectedRoute>
                        <Category />
                    </ProtectedRoute>
                } />

                <Route path="/education" element={
                    <ProtectedRoute>
                        <Education />
                    </ProtectedRoute>
                } />

                <Route path="/user-education" element={
                    <ProtectedRoute>
                        <UserEducation />
                    </ProtectedRoute>
                } />

                <Route path="/saving-goal" element={
                    <ProtectedRoute>
                        <SavingGoal />
                    </ProtectedRoute>
                } />

                <Route path="/saving-account" element={
                    <ProtectedRoute>
                        <SavingAccount />
                    </ProtectedRoute>
                } />

                <Route path="/chatbot" element={
                    <ProtectedRoute>
                        <ChatBot />
                    </ProtectedRoute>
                } />
                
                {/* Catch all route - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

export default AppRoutes;