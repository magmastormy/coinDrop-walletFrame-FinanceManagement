import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './components/Auth/userLoginForm';
import Register from './components/Auth/userRegistrationForm';
import Dashboard from './components/Dashboard/dashboardManager';
import Wallet from './components/Wallet/walletManager';
import Budget from './components/Budget/budgetManager';
import Transaction from './components/Transaction/transactionManager';
import Home from './pages/Home';
import Sidebar from './components/Sidebar/sideBar';
import Profile from './components/Profile/profileManager';
import Category from './components/Category/categoryManager';
import Education from './components/Education/educationManager';
import UserEducation from './components/Education/userEducation/userEducationManager';
import SavingGoal from './components/Savings/savingsGoalManager';
import SavingAccount from './components/Savings/savingsAccountManager';
import ChatBot from './components/Chatbot/chatbotManager';

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
                
                {/* Home Route */}
                <Route path="/" element={<Home />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

export default AppRoutes; 