import { Navigate, Outlet } from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';
import LoadingSpinner from '../../assets/loadingSpinner';

const ProtectedRoute = ({children}) => {
    const {isAuthenticated, loading} = useAuth();

    console.log ('ProtectedRoute - isAuthenticated: ', isAuthenticated);

    if (loading){ return <LoadingSpinner/>};

    if (!isAuthenticated){
        console.log('ProtectedRoute - No user authenticated, redirecting to Login.');
        return <Navigate to="/login" replace/>;
    }

    console.log("ProtectedRoute - rendering protected content");
    return children || <Outlet/>;
};

export default ProtectedRoute;

