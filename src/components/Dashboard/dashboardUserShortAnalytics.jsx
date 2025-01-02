import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faArrowTrendDown,
    faCoins,
    faChartPie,
    faChartLine,
    faWallet
} from '@fortawesome/free-solid-svg-icons';

const DashboardUserShortAnalytics = ({ analytics }) => {
    // Mock data - replace with real data from props or API
    const data = {
        totalBalance: 15420.50,
        totalProfit: 2340.75,
        profitPercentage: 17.9,
        activeInvestments: 8,
        portfolioDiversity: 75, // percentage of portfolio spread across different assets
        monthlyGrowth: 8.5,
        recentTransactions: 12
    };

    const metrics = [
        {
            title: 'Total Balance',
            value: `$${data.totalBalance.toLocaleString()}`,
            icon: faWallet,
            color: '#3b82f6',
            trend: 'up',
            trendValue: '+2.5%'
        },
        {
            title: 'Total Profit',
            value: `$${data.totalProfit.toLocaleString()}`,
            icon: faCoins,
            color: '#10b981',
            trend: 'up',
            trendValue: `+${data.profitPercentage}%`
        },
        {
            title: 'Portfolio Diversity',
            value: `${data.portfolioDiversity}%`,
            icon: faChartPie,
            color: '#8b5cf6',
            trend: 'neutral'
        },
        {
            title: 'Monthly Growth',
            value: `${data.monthlyGrowth}%`,
            icon: faChartLine,
            color: '#ef4444',
            trend: 'up',
            trendValue: '+3.2%'
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

    const getTrendIcon = (trend) => {
        if (trend === 'up') return faArrowTrendUp;
        if (trend === 'down') return faArrowTrendDown;
        return null;
    };

    const getTrendClass = (trend) => {
        if (trend === 'up') return 'trend-up';
        if (trend === 'down') return 'trend-down';
        return '';
    };

    return (
        <motion.div 
            className="analytics-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {metrics.map((metric, index) => (
                <motion.div
                    key={metric.title}
                    className="analytics-card"
                    variants={itemVariants}
                    whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                    }}
                >
                    <div className="analytics-card-header">
                        <FontAwesomeIcon 
                            icon={metric.icon} 
                            className="analytics-icon"
                            style={{ color: metric.color }}
                        />
                        <h3>{metric.title}</h3>
                    </div>
                    <div className="analytics-card-content">
                        <span className="analytics-value">{metric.value}</span>
                        {metric.trend && metric.trendValue && (
                            <div className={`trend ${getTrendClass(metric.trend)}`}>
                                <FontAwesomeIcon icon={getTrendIcon(metric.trend)} />
                                <span>{metric.trendValue}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default DashboardUserShortAnalytics;