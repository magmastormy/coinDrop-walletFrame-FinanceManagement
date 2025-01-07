import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDashboard, faTools, faDoorClosed, faWallet, faCreditCard, faUser, faChartPie, faBookOpen, faExchangeAlt, faPiggyBank, faBank, faRobot } from '@fortawesome/free-solid-svg-icons';
import './styles/sideBarstyle.css';

const Sidebar = ({ isAuthenticated }) => {
    if (!isAuthenticated) return null;

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

    return (
        <div className="sidebar">
            <h1>WalletFrame</h1>
            <nav>
                {menuItems.map(item => (
                    <Link key={item.link} to={item.link}>
                        <FontAwesomeIcon icon={item.icon} />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;