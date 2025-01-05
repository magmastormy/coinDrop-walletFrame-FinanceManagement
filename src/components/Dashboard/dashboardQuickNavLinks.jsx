import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWallet,
    faChartPie,
    faMoneyBillTransfer,
    faGear,
    faGraduationCap,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';
import './styles/dashboardQuickNavLinksStyles.css';

const DashboardQuickNavLinks = () => {
    const navLinks = [
        {
            to: '/wallet',
            icon: faWallet,
            title: 'Wallets',
            description: 'Manage your wallets and accounts',
            gradient: 'from-blue-500 to-blue-400'
        },
        {
            to: '/category',
            icon: faChartPie,
            title: 'Categories',
            description: 'Organize your expenses',
            gradient: 'from-purple-500 to-purple-400'
        },
        {
            to: '/transaction',
            icon: faMoneyBillTransfer,
            title: 'Transactions',
            description: 'Track income and expenses',
            gradient: 'from-green-500 to-green-400'
        },
        {
            to: '/investments',
            icon: faChartLine,
            title: 'Investments',
            description: 'Monitor your portfolio',
            gradient: 'from-amber-500 to-amber-400'
        },
        {
            to: '/education',
            icon: faGraduationCap,
            title: 'Learn',
            description: 'Financial education resources',
            gradient: 'from-red-500 to-red-400'
        },
        {
            to: '/settings',
            icon: faGear,
            title: 'Settings',
            description: 'Configure your preferences',
            gradient: 'from-gray-600 to-gray-500'
        }
    ];

    return (
        <motion.div 
            className="quick-nav-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="quick-nav-header">
                <h3>Quick Navigation</h3>
            </div>
            <div className="quick-nav-grid">
                {navLinks.map((link, index) => (
                    <motion.div
                        key={link.to}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                            ease: "easeOut"
                        }}
                    >
                        <Link 
                            to={link.to}
                            className="quick-nav-item"
                        >
                            <motion.div 
                                className={`quick-nav-icon-wrapper bg-gradient-to-br ${link.gradient}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FontAwesomeIcon icon={link.icon} className="quick-nav-icon" />
                            </motion.div>
                            <div className="quick-nav-content">
                                <h4>{link.title}</h4>
                                <p>{link.description}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default DashboardQuickNavLinks;