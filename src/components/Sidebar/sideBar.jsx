import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDashboard, faTools, faDoorClosed, faWallet, faCreditCard, faUser, faChartPie, faBookOpen, faExchangeAlt, faPiggyBank, faBank, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/authContext';
import { logoutUser } from '../../services/authService';
import './styles/sideBarstyle.css';

const Sidebar = () => {
    const { isAuthenticated, token } = useAuth();
    const { isOpen, isMobile } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    // Effect to handle token validation and sidebar visibility
    useEffect(() => {
        const validateToken = () => {
            if (!token || !isAuthenticated) {
                setIsVisible(false);
                if (location.pathname !== '/login') {
                    navigate('/login');
                }
                return;
            }
            setIsVisible(true);
        };

        validateToken();
    }, [token, isAuthenticated, location.pathname, navigate]);

    // Handle logout
    const handleLogout = (e) => {
        e.preventDefault();
        logoutUser();
        navigate('/login');
    };

    // Don't render anything if not visible
    if (!isVisible) return null;

    const menuItems = [
        { name: 'Home', link: '/', icon: faHome },
        { name: 'Dashboard', link: '/dashboard', icon: faDashboard }, 
        { name: 'Wallet', link: '/wallet', icon: faWallet }, 
        { name: 'Budget', link: '/budget', icon: faCreditCard }, 
        { name: 'Transaction', link: '/transaction', icon: faExchangeAlt }, 
        { name: 'Savings Goals', link: '/saving-goal', icon: faPiggyBank },
        { name: 'Savings Accounts', link: '/saving-account', icon: faBank }, 
        { name: 'Categories', link: '/category', icon: faChartPie }, 
        { name: 'My Education Posts', link: '/user-education', icon: faBookOpen },
        { name: 'Education', link: '/education', icon: faBookOpen }, 
        { name: 'Chatbot', link: '/chatbot', icon: faRobot }, 
        { name: 'Settings', link: '/settings', icon: faTools },
        { name: 'Profile', link: '/profile', icon: faUser }
    ];

    const sidebarClass = `sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`;

    return (
        <aside className={sidebarClass} role="navigation" aria-label="Main Navigation">
            <div className="sidebar-header">
                <h1>WalletFrame</h1>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <Link 
                        key={item.link} 
                        to={item.link}
                        className={location.pathname === item.link ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={item.icon} />
                        <span className="nav-text">{item.name}</span>
                    </Link>
                ))}
                <a 
                    href="#" 
                    onClick={handleLogout}
                    className={location.pathname === '/logout' ? 'active' : ''}
                >
                    <FontAwesomeIcon icon={faDoorClosed} />
                    <span className="nav-text">Logout</span>
                </a>
            </nav>
        </aside>
    );
};

export default Sidebar;