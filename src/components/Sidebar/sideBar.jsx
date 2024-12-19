import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDashboard, faTools, faDoorClosed, faWallet, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import './styles/sideBarstyle.css';

const Sidebar = ({ isAuthenticated }) => {
    if (!isAuthenticated) return null; // Do not render if not authenticated

    const menuItems = [
        { name: 'Home', link: '/', icon: faHome },
        { name: 'Dashboard', link: '/dashboard', icon: faDashboard },
        {name: 'Wallet', link: '/wallet', icon: faWallet},
        {name: 'Budget', link: '/budget', icon: faSackDollar},
        { name: 'Logout', link: '/logout', icon: faDoorClosed },
        {name: 'Transaction', link: '/transaction', icon: faSackDollar}, 
        {name: 'Settings', link: '/settings', icon: faTools}
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