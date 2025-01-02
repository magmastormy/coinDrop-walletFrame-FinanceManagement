import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWallet,
    faChartLine,
    faGraduationCap,
    faExchangeAlt,
    faHistory,
    faUserCog
} from '@fortawesome/free-solid-svg-icons';

const DashboardQuickNavLinks = () => {
    const navLinks = [
        {
            to: '/wallet',
            icon: faWallet,
            text: 'Wallet',
            color: '#3b82f6'
        },
        {
            to: '/markets',
            icon: faChartLine,
            text: 'Markets',
            color: '#10b981'
        },
        {
            to: '/education',
            icon: faGraduationCap,
            text: 'Learn',
            color: '#8b5cf6'
        },
        {
            to: '/trade',
            icon: faExchangeAlt,
            text: 'Trade',
            color: '#ef4444'
        },
        {
            to: '/history',
            icon: faHistory,
            text: 'History',
            color: '#f59e0b'
        },
        {
            to: '/settings',
            icon: faUserCog,
            text: 'Settings',
            color: '#6b7280'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div 
            className="quick-nav"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {navLinks.map((link, index) => (
                <motion.div
                    key={link.to}
                    variants={itemVariants}
                    whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link 
                        to={link.to}
                        className="quick-nav-link"
                        style={{
                            '--hover-color': link.color
                        }}
                    >
                        <FontAwesomeIcon 
                            icon={link.icon} 
                            className="quick-nav-icon"
                            style={{ color: link.color }}
                        />
                        <span>{link.text}</span>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default DashboardQuickNavLinks;