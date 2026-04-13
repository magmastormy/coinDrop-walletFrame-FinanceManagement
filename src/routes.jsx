import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './components/Layout/MainLayout';
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';

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
const AdminDashboardComponent = lazy(() => import('./components/Admin/AdminDashboard'));
const AdminUserManagementComponent = lazy(() => import('./components/Admin/AdminUserManagement'));
const AdminSystemConfigurationComponent = lazy(() => import('./components/Admin/AdminSystemConfiguration'));
const AdminTransactionsAuditComponent = lazy(() => import('./components/Admin/AdminTransactionsAudit'));
const AdminSecurityLogsComponent = lazy(() => import('./components/Admin/AdminSecurityLogs'));
const AdminDisasterRecoveryComponent = lazy(() => import('./components/Admin/AdminDisasterRecovery'));
const AdminAuditTrailComponent = lazy(() => import('./components/Admin/AdminAuditTrail'));
const AdminAccessControlsComponent = lazy(() => import('./components/Admin/AdminAccessControls'));
const AdminPerformanceComponent = lazy(() => import('./components/Admin/AdminPerformance'));
const AdminThirdPartyIntegrationsComponent = lazy(() => import('./components/Admin/AdminThirdPartyIntegrations'));
const IntegrationManagerComponent = lazy(() => import('./components/Integrations/IntegrationManager'));

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

                    <Route path="/integrations" element={
                        <ProtectedRoute>
                            <IntegrationManagerComponent />
                        </ProtectedRoute>
                    } />

                    <Route path="/responsive-test" element={
                        <ProtectedRoute>
                            <ResponsiveTestComponent />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <AdminProtectedRoute title="Admin Dashboard">
                            <AdminDashboardComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                        <AdminProtectedRoute title="User Management">
                            <AdminUserManagementComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/transactions" element={
                        <AdminProtectedRoute title="Transactions Audit">
                            <AdminTransactionsAuditComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/settings" element={
                        <AdminProtectedRoute title="Platform Configuration">
                            <AdminSystemConfigurationComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/security" element={
                        <AdminProtectedRoute title="Security Logs">
                            <AdminSecurityLogsComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/disaster-recovery" element={
                        <AdminProtectedRoute title="Disaster Recovery">
                            <AdminDisasterRecoveryComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/audit-trail" element={
                        <AdminProtectedRoute title="Audit Trail">
                            <AdminAuditTrailComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/access-controls" element={
                        <AdminProtectedRoute title="Access Controls">
                            <AdminAccessControlsComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/performance" element={
                        <AdminProtectedRoute title="Performance">
                            <AdminPerformanceComponent />
                        </AdminProtectedRoute>
                    } />
                    <Route path="/admin/integrations" element={
                        <AdminProtectedRoute title="Third-Party Integrations">
                            <AdminThirdPartyIntegrationsComponent />
                        </AdminProtectedRoute>
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
