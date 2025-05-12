import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './components/LoadingSpinner';

const LoginComponent = lazy(() => import('./components/Auth/userLoginForm'));
const RegisterComponent = lazy(() => import('./components/Auth/userRegistrationForm'));
const ForgotPasswordComponent = lazy(() => import('./components/Auth/ForgotPassword'));
const DashboardComponent = lazy(() => import('./components/Dashboard/dashboardManager'));
const WalletComponent = lazy(() => import('./components/Wallet/walletManager'));
const BudgetComponent = lazy(() => import('./components/Budget/budgetManager'));
const TransactionComponent = lazy(() => import('./components/Transaction/transactionManager'));
const HomeComponent = lazy(() => import('./pages/Home'));
const ProfileComponent = lazy(() => import('./components/Profile/profileManager'));
const CategoryComponent = lazy(() => import('./components/Category/categoryManager'));
const EducationComponent = lazy(() => import('./components/Education/educationManager'));
const UserEducationComponent = lazy(() => import('./components/Education/userEducation/userEducationManager'));
const SavingGoalComponent = lazy(() => import('./components/SavingsGoal/savingsGoalManager'));
const SavingAccountComponent = lazy(() => import('./components/Savings/savingsAccountManager'));
const ChatBotComponent = lazy(() => import('./components/Chatbot/chatbotManager'));

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
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
                        <PublicRoute>
                            <HomeComponent />
                        </PublicRoute>
                    } />
                    
                    <Route path="/login" element={
                        <PublicRoute>
                            <LoginComponent />
                        </PublicRoute>
                    } />
                    
                    <Route path="/register" element={
                        <PublicRoute>
                            <RegisterComponent />
                        </PublicRoute>
                    } />

                    <Route path="/forgot-password" element={
                        <PublicRoute>
                            <ForgotPasswordComponent />
                        </PublicRoute>
                    } />
                    <Route path="/reset-password" element={
                        <PublicRoute>
                            <ForgotPasswordComponent />
                        </PublicRoute>
                    } />
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/wallet" element={
                        <ProtectedRoute>
                            <WalletComponent />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/budget" element={
                        <ProtectedRoute>
                            <BudgetComponent />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/transaction" element={
                        <ProtectedRoute>
                            <TransactionComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfileComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/category" element={
                        <ProtectedRoute>
                            <CategoryComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/education" element={
                        <ProtectedRoute>
                            <EducationComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/user-education" element={
                        <ProtectedRoute>
                            <UserEducationComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/saving-goal" element={
                        <ProtectedRoute>
                            <SavingGoalComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/saving-account" element={
                        <ProtectedRoute>
                            <SavingAccountComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/chatbot" element={
                        <ProtectedRoute>
                            <ChatBotComponent />
                        </ProtectedRoute>
                    } />
                    
                    {/* Catch all route - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </div>
    );
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired
};

PublicRoute.propTypes = {
    children: PropTypes.node.isRequired
};

export default AppRoutes;