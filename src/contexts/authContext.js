import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const PUBLIC_ROUTES = ['/login', '/register', '/'];

export const useAuth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    
    useEffect(() => {
        const currentPath = location.pathname;
        
        // If authenticated and on home page, redirect to dashboard
        if (isAuthenticated && currentPath === '/') {
            navigate('/dashboard');
            return;
        }

        // If authenticated and trying to access login/register, redirect to dashboard
        if (isAuthenticated && (currentPath === '/login' || currentPath === '/register')) {
            navigate('/dashboard');
            return;
        }

        // Only redirect to login if not authenticated and trying to access a protected route
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentPath)) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate, location.pathname]);

    return {
        user,
        token,
        isAuthenticated
    };
};
