import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate} from 'react-router-dom';

export const useAuth = () => {
    const navigate = useNavigate();
    const {user, token, isAuthenticated} = useSelector((state)=> state.auth);
    
    console.log('AuthContext - useAuth : user', user, ', isAuthenticated: ', isAuthenticated);

    useEffect ( ()=>{
        if(isAuthenticated && window.location.pathname === '/')
        {
            console.log('AuthContext - useAuth : user is authenticated && is at home '/' location');
            navigate('/dashboard');
        } else if (!isAuthenticated) {
            console.log('AuthContext - useAuth : user is NOT authenticated. Going to login.');
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    return{
        user,
        token,
        isAuthenticated
    };
};





