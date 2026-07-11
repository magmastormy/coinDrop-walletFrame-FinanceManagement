import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import LoadingSpinner from '../../assets/loadingSpinner';

const ProtectedRoute = ({ children }) => {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) return <LoadingSpinner />;

    if (!isSignedIn) {
        return <Navigate to="/login" replace />;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;
