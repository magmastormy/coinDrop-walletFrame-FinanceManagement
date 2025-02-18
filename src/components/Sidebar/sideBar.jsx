import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, 
    faDashboard, 
    faTools, 
    faDoorClosed, 
    faWallet, 
    faCreditCard, 
    faUser, 
    faChartPie, 
    faBookOpen, 
    faExchangeAlt, 
    faPiggyBank, 
    faBank,
    faSignOut,
    faRobot 
} from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import { useTheme } from '../../theme/ThemeContext';
import ThemeToggle from './ThemeToggle';
import './styles/sideBarstyle.css';

const Sidebar = () => {
    const { isOpen, isMobile, toggleSidebar } = useSidebar();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setIsVisible(!!user);
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    if (!isVisible) {
        return null;
    }

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
        { name: 'Profile', link: '/profile', icon: faUser },
        { name: 'Logout', link: '/logout', icon: faSignOut }
    ];

    const sidebarClass = `sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`;

    return (
        <aside 
            className={sidebarClass} 
            role="navigation" 
            aria-label="Main Navigation"
            style={{
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                transition: theme.transition,
                borderRight: `1px solid ${theme.background.primary}`
            }}
        >
            <div 
                className="sidebar-header"
                style={{ borderBottom: `1px solid ${theme.background.primary}` }}
            >
                <h1 style={{ color: theme.text.heading }}>WalletFrame</h1>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <Link 
                        key={item.link} 
                        to={item.link}
                        className={`nav-link ${isActiveRoute(item.link) ? 'active' : ''}`}
                        style={{
                            color: theme.text.primary,
                            '&:hover': {
                                backgroundColor: theme.button.base + '20'
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={item.icon} />
                        <span className="nav-text">{item.name}</span>
                    </Link>
                ))}
                <a 
                    onClick={handleLogout} 
                    className="nav-link logout"
                    style={{
                        color: theme.text.primary,
                        '&:hover': {
                            backgroundColor: theme.button.base + '20'
                        }
                    }}
                >
                    <FontAwesomeIcon icon={faDoorClosed} />
                    <span className="nav-text">Logout</span>
                </a>
            </nav>

            <div 
                style={{ 
                    marginTop: 'auto', 
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 20
                }}
            >
                <hr style={{ 
                    width: '80%', 
                    marginBottom: 20,
                    border: 'none',
                    borderTop: `1px solid ${theme.background.primary}`
                }} />
                <ThemeToggle />
            </div>
        </aside>
    );
};

export default Sidebar;