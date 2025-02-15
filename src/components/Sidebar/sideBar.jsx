import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDashboard, faTools, faDoorClosed, faWallet, faCreditCard, faUser, faChartPie, faBookOpen, faExchangeAlt, faPiggyBank, faBank, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from './SidebarContext';
import './styles/sideBarstyle.css';

const Sidebar = ({ isAuthenticated }) => {
    if (!isAuthenticated) return null;

    const { isOpen, isMobile } = useSidebar();
    const location = useLocation();

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
        { name: 'Logout', link: '/logout', icon: faDoorClosed }, 
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
            </nav>
        </aside>
    );
};

export default Sidebar;