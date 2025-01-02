import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSun, 
    faMoon, 
    faCloud,
    faCloudSun,
    faCloudMoon
} from '@fortawesome/free-solid-svg-icons';
import './styles/dashboardUserGreetingsStyles.css';

const DashboardUserGreetings = () => {
    const { user } = useSelector(state => state.auth);
    const currentHour = new Date().getHours();

    const getTimeBasedGreeting = () => {
        if (currentHour >= 5 && currentHour < 12) {
            return {
                greeting: 'Good Morning',
                icon: faSun,
                timeClass: 'morning'
            };
        } else if (currentHour >= 12 && currentHour < 17) {
            return {
                greeting: 'Good Afternoon',
                icon: faCloudSun,
                timeClass: 'afternoon'
            };
        } else if (currentHour >= 17 && currentHour < 20) {
            return {
                greeting: 'Good Evening',
                icon: faCloudMoon,
                timeClass: 'evening'
            };
        } else {
            return {
                greeting: 'Good Night',
                icon: faMoon,
                timeClass: 'night'
            };
        }
    };

    const { greeting, icon, timeClass } = getTimeBasedGreeting();

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const iconVariants = {
        hidden: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                delay: 0.2
            }
        }
    };

    return (
        <motion.div 
            className={`greeting-container ${timeClass}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="greeting-content">
                <div className="greeting-text">
                    <h1>{greeting}, {user?.username || 'User'}!</h1>
                    <p>Welcome to your CoinDrop dashboard</p>
                </div>
                <motion.div 
                    className="greeting-icon"
                    variants={iconVariants}
                >
                    <FontAwesomeIcon icon={icon} />
                </motion.div>
            </div>
            <div className="greeting-stats">
                <div className="stat-item">
                    <span className="stat-label">Portfolio Value</span>
                    <span className="stat-value">${user?.portfolioValue?.toLocaleString() || '0'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">24h Change</span>
                    <span className={`stat-value ${user?.dailyChange >= 0 ? 'positive' : 'negative'}`}>
                        {user?.dailyChange >= 0 ? '+' : ''}{user?.dailyChange || 0}%
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Active Assets</span>
                    <span className="stat-value">{user?.activeAssets || 0}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardUserGreetings;