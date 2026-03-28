import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './components/Layout/MainLayout';

const LoginComponent = lazy(() => import('./components/Auth/UserLoginForm'));
const RegisterComponent = lazy(() => import('./components/Auth/UserRegistrationForm'));
const ForgotPasswordComponent = lazy(() => import('./components/Auth/ForgotPassword'));
const DashboardComponent = lazy(() => import('./components/Dashboard/DashboardManager'));
const WalletComponent = lazy(() => import('./components/Wallet/WalletManager'));
const BudgetComponent = lazy(() => import('./components/Budget/BudgetManager'));
const TransactionComponent = lazy(() => import('./components/Transaction/TransactionManager'));
const HomeComponent = lazy(() => import('./pages/Home'));
const ResponsiveTestComponent = lazy(() => import('./pages/ResponsiveTest'));
const CategoryComponent = lazy(() => import('./components/Category/CategoryManager'));
const EducationComponent = lazy(() => import('./components/Education/EducationManager'));
const UserEducationComponent = lazy(() => import('./components/Education/userEducation/UserEducationManager'));
const SavingGoalComponent = lazy(() => import('./components/SavingsGoal/SavingsGoalManager'));
const SavingAccountComponent = lazy(() => import('./components/Savings/SavingsAccountManager'));
const ChatBotComponent = lazy(() => import('./components/Chatbot/ChatbotManager'));
const UserManagementComponent = lazy(() => import('./components/UserManagement/UserManagement'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <MainLayout>{children}</MainLayout>;
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

                    <Route path="/user-management" element={
                        <ProtectedRoute>
                            <UserManagementComponent />
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

                    <Route path="/responsive-test" element={
                        <ProtectedRoute>
                            <ResponsiveTestComponent />
                        </ProtectedRoute>
                    } />

                    {/* Redirect old profile and settings routes to new user-management */}
                    <Route path="/profile" element={<Navigate to="/user-management" replace />} />
                    <Route path="/settings" element={<Navigate to="/user-management" replace />} />

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
