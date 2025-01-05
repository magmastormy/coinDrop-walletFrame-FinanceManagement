import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSun,
    faMoon,
    faClock,
    faCloudSun
} from '@fortawesome/free-solid-svg-icons';
import './styles/dashboardUserGreetingsStyles.css';

const DashboardUserGreetings = () => {
    const { user } = useSelector(state => state.auth);
    const currentHour = new Date().getHours();

    const getGreeting = () => {
        if (currentHour >= 5 && currentHour < 12) {
            return {
                text: 'Good Morning',
                icon: faSun,
                gradient: 'from-yellow-400 to-orange-300'
            };
        } else if (currentHour >= 12 && currentHour < 17) {
            return {
                text: 'Good Afternoon',
                icon: faCloudSun,
                gradient: 'from-blue-400 to-cyan-300'
            };
        } else if (currentHour >= 17 && currentHour < 21) {
            return {
                text: 'Good Evening',
                icon: faClock,
                gradient: 'from-indigo-400 to-purple-300'
            };
        } else {
            return {
                text: 'Good Night',
                icon: faMoon,
                gradient: 'from-purple-400 to-pink-300'
            };
        }
    };

    const greeting = getGreeting();
    const firstName = user?.firstName?.split(' ')[0] || 'Guest';
    const lastName = user?.lastName?.split(' ')[0] || '';

    const getRandomMotivationalQuote = () => {
        const quotes = [
            "Track your spending today for a better tomorrow.",
            "Small savings add up to big dreams.",
            "Your financial future starts with today's decisions.",
            "Every penny saved is a penny earned.",
            "Invest in yourself and your dreams.",
            "Financial freedom is a journey, not a destination."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

    return (
        <motion.div 
            className="greetings-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="greetings-content">
                <motion.div 
                    className={`greeting-icon-wrapper bg-gradient-to-br ${greeting.gradient}`}
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                        duration: 0.6, 
                        ease: "easeOut",
                        delay: 0.2
                    }}
                >
                    <FontAwesomeIcon icon={greeting.icon} className="greeting-icon" />
                </motion.div>
                <div className="greeting-text">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        {greeting.text}, {firstName} {lastName}!
                    </motion.h2>
                    <motion.p
                        className="greeting-quote"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        {getRandomMotivationalQuote()}
                    </motion.p>
                </div>
            </div>
            <motion.div 
                className="greeting-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
            >
                <div className="stat-item">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faSun} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Today's Goal</span>
                        <span className="stat-value">$50.00</span>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Streak</span>
                        <span className="stat-value">7 days</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DashboardUserGreetings;