import { Navigate, Outlet } from 'react-router-dom';
import {useAuth} from '../../contexts/authContext';
import LoadingSpinner from '../../assets/loadingSpinner';

const ProtectedRoute = ({children}) => {
    const {isAuthenticated, loading} = useAuth();

    if (loading) return <LoadingSpinner/>;

    if (!isAuthenticated){
        return <Navigate to="/login" replace/>;
    }

    return children || <Outlet/>;
};

export default ProtectedRoute;

